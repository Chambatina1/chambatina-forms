import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    // Guardar en BD local (sin sincronizar a SolvedCargo automaticamente)
    const shipment = await db.shipment.create({
      data: {
        sname: (body.sname || "").toUpperCase().trim(),
        sphone: (body.sphone || "").toUpperCase().trim(),
        saddress: (body.saddress || "").toUpperCase().trim(),
        semail: (body.semail || "").trim(),
        sbirthday: (body.sbirthday || ""),
        snacionality: (body.snacionality || "").toUpperCase().trim(),
        cname: body.cname.toUpperCase().trim(),
        cidentity: cleanIdentity.toUpperCase(),
        cphone: (body.cphone || "").toUpperCase().trim(),
        caddress: (body.caddress || "").toUpperCase().trim(),
        cprovince: (body.cprovince || "").toUpperCase().trim(),
        weight: body.weight || "",
        npieces: body.npieces || "1",
        description: (body.description || "").toUpperCase().trim(),
        cnotes: (body.cnotes || "").toUpperCase().trim(),
        syncedToApi: false,
        status: "PENDIENTE",
      },
    });

    // Generar numero de seguimiento local
    const trackingNumber = `CHB-${shipment.id.slice(-8).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      message: "Envio registrado. Un administrador lo cargara a SolvedCargo.",
      trackingNumber,
      shipmentId: shipment.id,
      syncedToApi: false,
    });
  } catch (error) {
    console.error("Error en API submit:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor. Intente nuevamente." },
      { status: 500 }
    );
  }
}

// GET - Obtener todos los envios (admin)
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
