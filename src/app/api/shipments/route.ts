import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH - Actualizar estado o número CPK de un envío
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get("key");

    if (adminKey !== "chambatina-admin-2026") {
      return NextResponse.json(
        { success: false, message: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, cpkNumber, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID del envío requerido" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (cpkNumber !== undefined) updateData.cpkNumber = cpkNumber;
    if (status !== undefined) updateData.status = status;
    if (cpkNumber) updateData.syncedToApi = true;

    const shipment = await db.shipment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, shipment });
  } catch (error) {
    console.error("Error actualizando envío:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un envío
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get("key");

    if (adminKey !== "chambatina-admin-2026") {
      return NextResponse.json(
        { success: false, message: "No autorizado" },
        { status: 401 }
      );
    }

    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID del envío requerido" },
        { status: 400 }
      );
    }

    await db.shipment.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Envío eliminado" });
  } catch (error) {
    console.error("Error eliminando envío:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
