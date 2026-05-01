import { NextResponse } from "next/server";
import { login, checkSession, searchShipments } from "@/lib/solvedcargo";

export async function GET() {
  try {
    // 1. Login
    const session = await login();

    // 2. Validar sesion
    const isValid = await checkSession(session);

    // 3. Buscar ultimos envios de la empresa
    let lastShipments: unknown[] = [];
    try {
      lastShipments = await searchShipments(
        session,
        `(r.identerprise = 55) AND ((r.deleted = 0) OR (r.deleted IS NULL))`
      );
    } catch {
      // No es critico
    }

    return NextResponse.json({
      status: "ok",
      login: {
        success: true,
        iduser: session.iduser,
        identerprise: session.identerprise,
        sessionValid: isValid,
      },
      lastShipmentsCount: Array.isArray(lastShipments)
        ? lastShipments.length
        : 0,
      lastShipments: Array.isArray(lastShipments)
        ? lastShipments.slice(-3)
        : [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
