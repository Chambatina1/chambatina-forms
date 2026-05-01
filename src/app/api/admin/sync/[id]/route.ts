import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createFullShipment } from "@/lib/solvedcargo";

// POST /api/admin/sync/[id] — Cargar envio a SolvedCargo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Obtener el envio de la BD local
    const shipment = await db.shipment.findUnique({ where: { id } });
    if (!shipment) {
      return NextResponse.json(
        { success: false, message: "Envio no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si ya fue sincronizado
    if ((shipment as Record<string, unknown>).syncedToApi) {
      return NextResponse.json({
        success: false,
        message: "Este envio ya fue cargado a SolvedCargo anteriormente.",
        alreadySynced: true,
        reserveId: (shipment as Record<string, unknown>).cpkNumber,
      });
    }

    // Preparar datos para SolvedCargo
    const s = shipment as Record<string, unknown>;
    const result = await createFullShipment({
      sname: (s.sname as string) || "",
      sphone: (s.sphone as string) || "",
      saddress: (s.saddress as string) || "",
      semail: (s.semail as string) || "",
      cname: (s.cname as string) || "",
      cidentity: (s.cidentity as string) || "",
      cphone: (s.cphone as string) || "",
      caddress: (s.caddress as string) || "",
      cprovince: (s.cprovince as string) || "",
      weight: (s.weight as string) || "",
      npieces: (s.npieces as string) || "1",
      description: (s.description as string) || "",
      cnotes: (s.cnotes as string) || "",
    });

    if (result.success) {
      // Actualizar BD local con resultado exitoso
      await db.shipment.update({
        where: { id },
        data: {
          syncedToApi: true,
          shipperIdApi: result.shipperId || "",
          consigneeIdApi: result.consigneeId || "",
          cpkNumber: result.reserveId || "",
          apiResponse: result.message,
          status: "REGISTRADO",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Envio cargado a SolvedCargo exitosamente. Reserve ID: ${result.reserveId}`,
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
    console.error("Error en sync:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor", error: error instanceof Error ? error.message : "Desconocido" },
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
