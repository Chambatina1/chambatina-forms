import { NextResponse } from 'next/server';
import { login, checkSession, searchRecords } from '../../../../lib/solvedcargo';

export async function GET() {
  try {
    // Step 1: Login
    const session = await login();
    const loginResult = {
      success: true,
      sessionId: session.sessionId.substring(0, 8) + '...',
      enterpriseId: session.enterpriseId,
    };

    // Step 2: Check session
    const sessionValid = await checkSession();

    // Step 3: Search records
    const searchResults = await searchRecords('CHAMBATINA');

    return NextResponse.json({
      login: loginResult,
      sessionValid,
      searchResultsPreview: searchResults.substring(0, 500),
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
