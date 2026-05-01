import { NextResponse } from "next/server";
import { login, checkSession, getJsonSchema, getNewRow, searchShipments } from "@/lib/solvedcargo";

export async function GET() {
  try {
    // 1. Login
    const session = await login();

    // 2. Validar sesión
    const isValid = await checkSession(session);

    // 3. Obtener schema JSON de la tabla reservef
    let schemaInfo = "No disponible";
    try {
      const jsonSchema = await getJsonSchema(session, "reservef");
      // Intentar parsear si es JSON válido
      try {
        const parsed = JSON.parse(jsonSchema);
        schemaInfo = JSON.stringify(parsed, null, 2);
      } catch {
        schemaInfo = jsonSchema.substring(0, 2000);
      }
    } catch (e) {
      schemaInfo = `Error obteniendo schema: ${e instanceof Error ? e.message : "desconocido"}`;
    }

    // 4. Obtener formulario vacío
    let newRowInfo = "No disponible";
    try {
      const newRow = await getNewRow(session, "reservef");
      newRowInfo = newRow.substring(0, 3000);
    } catch (e) {
      newRowInfo = `Error obteniendo newRow: ${e instanceof Error ? e.message : "desconocido"}`;
    }

    // 5. Buscar últimos envíos de la empresa
    let lastShipments: unknown[] = [];
    try {
      lastShipments = await searchShipments(
        session,
        `(r.identerprise = 55) AND ((r.deleted = 0) OR (r.deleted IS NULL))`
      );
    } catch (e) {
      // No es crítico
    }

    return NextResponse.json({
      status: "ok",
      login: {
        success: true,
        iduser: session.iduser,
        identerprise: session.identerprise,
        enterprise: session.enterprise,
        sessionValid: isValid,
      },
      schema: schemaInfo,
      newRow: newRowInfo,
      lastShipmentsCount: Array.isArray(lastShipments) ? lastShipments.length : 0,
      lastShipments: Array.isArray(lastShipments)
        ? lastShipments.slice(-3) // Últimos 3
        : [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
