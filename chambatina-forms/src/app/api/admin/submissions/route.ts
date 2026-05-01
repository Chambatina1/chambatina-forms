import { NextRequest, NextResponse } from 'next/server';
import { getAllSubmissions } from '../../../../lib/db';

const ADMIN_KEY = 'chambatina-admin-2026';

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key');

    if (key !== ADMIN_KEY) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const submissions = getAllSubmissions();

    return NextResponse.json({
      success: true,
      total: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
