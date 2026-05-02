import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createFullShipment, repairReserve } from "@/lib/solvedcargo";

// POST /api/admin/sync/[id] — Cargar envio a SolvedCargo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`[Admin Sync] Iniciando sync para envio: ${id}`);

    // Obtener el envio de la BD local
    const shipment = await db.shipment.findUnique({ where: { id } });
    if (!shipment) {
      console.log(`[Admin Sync] Envio no encontrado: ${id}`);
      return NextResponse.json(
        { success: false, message: "Envio no encontrado" },
        { status: 404 }
      );
    }

    const s = shipment as Record<string, unknown>;

    // Permitir re-sincronizar con query param force=true
    const { searchParams } = new URL(request.url);
    const forceSync = searchParams.get("force") === "true";

    if (s.syncedToApi && !forceSync) {
      console.log(`[Admin Sync] Envio ya sincronizado: ${id} (usar ?force=true para re-sync)`);
      return NextResponse.json({
        success: false,
        message: "Este envio ya fue cargado a SolvedCargo. Use ?force=true para re-sincronizar.",
        alreadySynced: true,
        reserveId: s.cpkNumber,
      });
    }

    console.log(`[Admin Sync] Datos del envio:`, JSON.stringify({
      sname: s.sname,
      cname: s.cname,
      cidentity: s.cidentity,
      weight: s.weight,
      npieces: s.npieces,
      description: s.description,
    }));

    // Preparar datos para SolvedCargo
    const result = await createFullShipment({
      sname: (s.sname as string) || "",
      sphone: (s.sphone as string) || "",
      saddress: (s.saddress as string) || "",
      semail: (s.semail as string) || "",
      sbirthday: (s.sbirthday as string) || "",
      snacionality: (s.snacionality as string) || "",
      cname: (s.cname as string) || "",
      cidentity: (s.cidentity as string) || "",
      cphone: (s.cphone as string) || "",
      caddress: (s.caddress as string) || "",
      cprovince: (s.cprovince as string) || "",
      cmunicipality: (s.cmunicipality as string) || "",
      weight: (s.weight as string) || "",
      npieces: (s.npieces as string) || "1",
      description: (s.description as string) || "",
      cnotes: (s.cnotes as string) || "",
    });

    console.log(`[Admin Sync] Resultado SolvedCargo:`, JSON.stringify(result));

    if (result.success) {
      // Actualizar BD local con resultado exitoso
      await db.shipment.update({
        where: { id },
        data: {
          syncedToApi: true,
          shipperIdApi: result.shipperId || "",
          consigneeIdApi: result.consigneeId || "",
          cpkNumber: result.cpkNumber || result.reserveId || "",
          apiResponse: result.message,
          status: "REGISTRADO",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Envio cargado a SolvedCargo exitosamente. Reserve ID: ${result.reserveId}. Shipper: ${result.shipperId}. Consignee: ${result.consigneeId}`,
        shipperId: result.shipperId,
        consigneeId: result.consigneeId,
        reserveId: result.reserveId,
      });
    } else {
      // Guardar error en la BD
      await db.shipment.update({
        where: { id },
        data: {
          apiResponse: result.message + (result.error ? ` | Error: ${result.error}` : ""),
          status: "ERROR_API",
        },
      });

      return NextResponse.json({
        success: false,
        message: result.message,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("[Admin Sync] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Desconocido",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/sync/[id] — Reparar reserve existente en SolvedCargo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shipment = await db.shipment.findUnique({ where: { id } });
    if (!shipment) {
      return NextResponse.json({ success: false, message: "Envio no encontrado" }, { status: 404 });
    }

    // Buscar reserveId del envio (puede estar en cpkNumber o en apiResponse)
    const s = shipment as Record<string, unknown>;
    let reserveId = s.cpkNumber as string | undefined;

    // Si cpkNumber tiene formato "CPK-XXXXXXX", buscar reserveId en apiResponse
    if (reserveId && reserveId.startsWith("CPK-")) {
      const match = ((s.apiResponse as string) || "").match(/Reserve ID:\s*(\d+)/);
      if (match) reserveId = match[1];
    }

    // Tambien intentar extraer del campo reserveIdApi si existe
    if (!reserveId || reserveId.startsWith("CPK-")) {
      const apiResp = (s.apiResponse as string) || "";
      const match = apiResp.match(/Reserve ID:\s*(\d+)/);
      if (match) reserveId = match[1];
    }

    if (!reserveId || reserveId.startsWith("CPK-") || !/^\d+$/.test(reserveId)) {
      return NextResponse.json({
        success: false,
        message: "No se encontro un Reserve ID numerico para este envio",
      });
    }

    console.log(`[Admin Repair] Reparando reserve ID=${reserveId} del envio ${id}`);
    const result = await repairReserve(reserveId);

    if (result.success) {
      await db.shipment.update({
        where: { id },
        data: {
          apiResponse: result.message,
          status: "REGISTRADO",
        },
      });

      return NextResponse.json({
        success: true,
        message: result.message,
        reserveId,
      });
    }

    return NextResponse.json({ success: false, message: result.message });
  } catch (error) {
    console.error("[Admin Repair] Error:", error);
    return NextResponse.json(
      { success: false, message: "Error al reparar", error: error instanceof Error ? error.message : "Desconocido" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/sync/[id] — Eliminar envio
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.shipment.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Envio eliminado" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error al eliminar" },
      { status: 500 }
    );
  }
}
