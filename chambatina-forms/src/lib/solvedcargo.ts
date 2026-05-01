// SolvedCargo API Client
// Base URL: https://www.solvedc.com/cargo/cargopack/v1

const BASE_URL = 'https://www.solvedc.com/cargo/cargopack/v1';
const LOGIN_USER = 'GEO MIA';
const LOGIN_PASS = 'GEO**091223';
const ENTERPRISE_ID = '55'; // CHAMBATINA MIAMI

interface SessionInfo {
  sessionId: string;
  enterpriseId: string;
  valid: boolean;
}

let currentSession: SessionInfo | null = null;
let sessionTimestamp: number = 0;

const SESSION_DURATION = 25 * 60 * 1000; // 25 minutes (API times out at 30)

export async function login(): Promise<SessionInfo> {
  const url = `${BASE_URL}/login.php`;
  const params = new URLSearchParams({
    user: LOGIN_USER,
    password: LOGIN_PASS,
    identerprise: ENTERPRISE_ID,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const phpSessionId = response.headers.get('set-cookie')?.match(/PHPSESSID=([^;]+)/)?.[1];

  if (!phpSessionId) {
    throw new Error('No PHPSESSID received from SolvedCargo login');
  }

  const text = await response.text();
  let enterpriseId = ENTERPRISE_ID;
  const eidMatch = text.match(/identerprise['"]?\s*[:=]\s*['"]?(\d+)/i);
  if (eidMatch) enterpriseId = eidMatch[1];

  currentSession = {
    sessionId: phpSessionId,
    enterpriseId,
    valid: true,
  };
  sessionTimestamp = Date.now();

  return currentSession;
}

export async function getSession(): Promise<SessionInfo> {
  if (currentSession && Date.now() - sessionTimestamp < SESSION_DURATION) {
    return currentSession;
  }
  return await login();
}

export async function checkSession(): Promise<boolean> {
  try {
    const session = await getSession();
    const url = `${BASE_URL}/checkSession.php`;
    const params = new URLSearchParams({ identerprise: session.enterpriseId });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: `PHPSESSID=${session.sessionId}`,
      },
      body: params.toString(),
    });

    const text = await response.text();
    return text.toLowerCase().includes('true') || text.toLowerCase().includes('session');
  } catch {
    currentSession = null;
    return false;
  }
}

export async function searchRecords(searchTerm: string) {
  const session = await getSession();
  const url = `${BASE_URL}/getListRecord.php`;
  const params = new URLSearchParams({
    identerprise: session.enterpriseId,
    search: searchTerm,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: `PHPSESSID=${session.sessionId}`,
    },
    body: params.toString(),
  });

  return await response.text();
}

export async function insertRecord(data: {
  name: string;
  identity: string;
  phone: string;
  province: string;
  address: string;
  weight: number;
  packages: number;
  description: string;
  embarcador: string;
}) {
  const session = await getSession();
  const url = `${BASE_URL}/insert.php`;
  const params = new URLSearchParams({
    identerprise: session.enterpriseId,
    idreservestate: 'CPK', // TransCargo / reservef
    datereserve: new Date().toISOString().split('T')[0],
    embarcador: data.embarcador,
    consignee: data.name,
    idconsignee: data.identity,
    phone: data.phone,
    province: data.province,
    address: data.address,
    weight: String(data.weight),
    packages: String(data.packages),
    description: data.description,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: `PHPSESSID=${session.sessionId}`,
    },
    body: params.toString(),
  });

  return {
    status: response.status,
    text: await response.text(),
    ok: response.ok,
  };
}
