import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createFullShipment } from "@/lib/solvedcargo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar campos requeridos del destinatario
    if (!body.cname || !body.cidentity) {
      return NextResponse.json(
        {
          success: false,
          message: "Nombre del destinatario y Carnet de identidad son obligatorios.",
        },
        { status: 400 }
      );
    }

    // Validar carnet
    const cleanIdentity = body.cidentity.replace(/\s/g, "");
    if (cleanIdentity.length < 11) {
      return NextResponse.json(
        { success: false, message: "El carnet de identidad debe tener al menos 11 caracteres." },
        { status: 400 }
      );
    }

    if (!body.cphone) {
      return NextResponse.json(
        { success: false, message: "El telefono del destinatario es obligatorio." },
        { status: 400 }
      );
    }

    // Guardar en BD local primero
    const shipment = await db.shipment.create({
      data: {
        sname: (body.sname || "").toUpperCase().trim(),
        sphone: (body.sphone || "").toUpperCase().trim(),
        saddress: (body.saddress || "").toUpperCase().trim(),
        semail: (body.semail || "").trim(),
        cname: body.cname.toUpperCase().trim(),
        cidentity: cleanIdentity.toUpperCase(),
        cphone: (body.cphone || "").toUpperCase().trim(),
        caddress: (body.caddress || "").toUpperCase().trim(),
        cprovince: (body.cprovince || "").toUpperCase().trim(),
        weight: body.weight || "",
        npieces: body.npieces || "1",
        description: (body.description || "").toUpperCase().trim(),
        cnotes: (body.cnotes || "").toUpperCase().trim(),
      },
    });

    // Intentar crear en SolvedCargo API
    let apiResult = null;
    try {
      apiResult = await createFullShipment({
        sname: body.sname || "",
        sphone: body.sphone || "",
        saddress: body.saddress || "",
        semail: body.semail || "",
        cname: body.cname,
        cidentity: body.cidentity,
        cphone: body.cphone,
        caddress: body.caddress || "",
        cprovince: body.cprovince || "",
        weight: body.weight || "",
        npieces: body.npieces || "1",
        description: body.description || "",
        cnotes: body.cnotes || "",
      });
    } catch (e) {
      console.error("Error SolvedCargo API:", e);
    }

    // Actualizar BD con resultado de la API
    if (apiResult?.success) {
      await db.shipment.update({
        where: { id: shipment.id },
        data: {
          syncedToApi: true,
          shipperIdApi: apiResult.shipperId || "",
          consigneeIdApi: apiResult.consigneeId || "",
          cpkNumber: apiResult.reserveId || "",
          apiResponse: apiResult.message,
          status: "REGISTRADO",
        },
      });
    }

    // Generar número de seguimiento local
    const trackingNumber = `CHB-${shipment.id.slice(-8).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      message: apiResult?.success
        ? "Envío registrado en SolvedCargo. El número CPK se generará automáticamente."
        : "Envío registrado localmente. Se procesará en SolvedCargo shortly.",
      trackingNumber,
      shipmentId: shipment.id,
      syncedToApi: apiResult?.success || false,
      reserveId: apiResult?.reserveId,
      apiMessage: apiResult?.message,
    });
  } catch (error) {
    console.error("Error en API submit:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor. Intente nuevamente." },
      { status: 500 }
    );
  }
}

// GET - Obtener todos los envíos (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get("key");

    if (adminKey !== "chambatina-admin-2026") {
      return NextResponse.json({ success: false, message: "No autorizado" }, { status: 401 });
    }

    const shipments = await db.shipment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, shipments, total: shipments.length });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error interno" }, { status: 500 });
  }
}
