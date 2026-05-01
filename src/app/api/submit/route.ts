import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar campos requeridos
    if (!body.cname || !body.cidentity) {
      return NextResponse.json(
        {
          success: false,
          message: "Los campos 'Nombre del destinatario' y 'Carnet de identidad' son obligatorios.",
        },
        { status: 400 }
      );
    }

    // Validar carnet
    const cleanIdentity = body.cidentity.replace(/\s/g, "");
    if (cleanIdentity.length < 11) {
      return NextResponse.json(
        {
          success: false,
          message: "El carnet de identidad debe tener al menos 11 caracteres.",
        },
        { status: 400 }
      );
    }

    // Guardar en la base de datos local
    const shipment = await db.shipment.create({
      data: {
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

    // Generar numero de seguimiento local
    const trackingNumber = `CHB-${String(shipment.id.slice(-8)).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      message: "Envio registrado exitosamente. Nuestro equipo procesara su solicitud.",
      trackingNumber,
      shipmentId: shipment.id,
    });
  } catch (error) {
    console.error("Error en API submit:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor. Intente nuevamente en unos minutos.",
      },
      { status: 500 }
    );
  }
}

// GET - Obtener todos los envíos (para admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get("key");

    // Clave admin simple para proteger la vista de envíos
    if (adminKey !== "chambatina-admin-2026") {
      return NextResponse.json(
        { success: false, message: "No autorizado" },
        { status: 401 }
      );
    }

    const shipments = await db.shipment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      shipments,
      total: shipments.length,
    });
  } catch (error) {
    console.error("Error obteniendo envíos:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
