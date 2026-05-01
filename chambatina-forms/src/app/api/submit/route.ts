import { NextRequest, NextResponse } from 'next/server';
import { insertSubmission } from '../../../lib/db';

function generateTrackingNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CHB-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Convert ALL fields to UPPERCASE as SolvedCargo requires
    const name = String(body.name || '').toUpperCase().trim();
    const identity = String(body.identity || '').toUpperCase().trim();
    const phone = String(body.phone || '').toUpperCase().trim();
    const province = String(body.province || '').toUpperCase().trim();
    const address = String(body.address || '').toUpperCase().trim();
    const weight = parseFloat(body.weight) || 0;
    const packages = parseInt(body.packages) || 0;
    const description = String(body.description || '').toUpperCase().trim();
    const embarcador = 'CHAMBATINA MIAMI';

    // Validation
    if (!name || !identity || !phone || !province || !address) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: nombre, carnet, telefono, provincia y direccion' },
        { status: 400 }
      );
    }

    if (weight <= 0) {
      return NextResponse.json(
        { error: 'El peso debe ser mayor a 0' },
        { status: 400 }
      );
    }

    if (packages <= 0) {
      return NextResponse.json(
        { error: 'La cantidad de bultos debe ser mayor a 0' },
        { status: 400 }
      );
    }

    const trackingNumber = generateTrackingNumber();

    const result = insertSubmission({
      trackingNumber,
      name,
      identity,
      phone,
      province,
      address,
      weight,
      packages,
      description,
      embarcador,
    });

    // Attempt to sync with SolvedCargo (non-blocking)
    try {
      const { insertRecord } = await import('../../../lib/solvedcargo');
      await insertRecord({
        name,
        identity,
        phone,
        province,
        address,
        weight,
        packages,
        description,
        embarcador,
      });
    } catch {
      // Sync failed - data saved locally, admin can sync later
    }

    return NextResponse.json({
      success: true,
      message: 'Envio registrado exitosamente',
      trackingNumber: result.trackingNumber,
      embarcador: embarcador,
    });
  } catch (error) {
    console.error('Error processing submission:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
