// SolvedCargo API Client para Chambatina
// Documentación completa en: https://www.solvedc.com/cargo/cargopack/v1

const BASE_URL = "https://www.solvedc.com/cargo/cargopack/v1";
const API_PATH = `${BASE_URL}/php/solved/routing.php`;

// Credenciales Chambatina
const AUTH = {
  user: "GEO MIA",
  password: "GEO**091223",
  identerprise: "55",
  iduser: "101",
};

interface SolvedCargoSession {
  phpsessid: string;
  iduser: string;
  identerprise: string;
}

// Cache de sesión en memoria (dura ~30 min)
let cachedSession: {
  session: SolvedCargoSession;
  expiresAt: number;
} | null = null;

// ============================================
// 1. LOGIN
// ============================================
export async function login(): Promise<SolvedCargoSession> {
  if (cachedSession && Date.now() < cachedSession.expiresAt) {
    return cachedSession.session;
  }

  console.log("[SolvedCargo] Login...");
  const response = await fetch(API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      funcname: "loginUser",
      user: AUTH.user,
      password: AUTH.password,
    }).toString(),
    redirect: "manual",
  });

  if (!response.ok) throw new Error(`Login falló: ${response.status}`);

  const setCookie = response.headers.get("set-cookie") || "";
  const match = setCookie.match(/PHPSESSID=([^;]+)/);
  if (!match) throw new Error("No se obtuvo PHPSESSID");

  const data = await response.json();
  console.log(`[SolvedCargo] Login OK: iduser=${data.iduser} enterprise=${data.identerprise}`);
  if (!data.iduser) throw new Error("Login no devolvió datos");

  const session: SolvedCargoSession = {
    phpsessid: match[1],
    iduser: data.iduser,
    identerprise: data.identerprise,
  };

  cachedSession = { session, expiresAt: Date.now() + 25 * 60 * 1000 };
  return session;
}

// ============================================
// 2. VALIDAR SESIÓN
// ============================================
export async function checkSession(session: SolvedCargoSession): Promise<boolean> {
  const body = new URLSearchParams({
    funcname: "checkIfValidSession",
    username: AUTH.user,
    password: AUTH.password,
  });

  const response = await fetch(API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `PHPSESSID=${session.phpsessid}`,
    },
    body: body.toString(),
  });

  return (await response.text()).trim() === "1";
}

// ============================================
// HELPERS
// ============================================
function buildCookie(session: SolvedCargoSession): string {
  return `PHPSESSID=${session.phpsessid}`;
}

// Elimina caracteres problemáticos para SQL pero mantiene espacios
function sanitize(value: string): string {
  return value.replace(/[;#&|]/g, "");
}

// ============================================
// 3. INSERT RECORD (genérico)
// ============================================
async function insertRecord(
  session: SolvedCargoSession,
  option: string,
  params: string
): Promise<string> {
  const body = new URLSearchParams({
    funcname: "insertRecord",
    option,
    params,
  }).toString();

  console.log(`[SolvedCargo] insertRecord option=${option} params=${params.substring(0, 200)}`);

  const response = await fetch(API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: buildCookie(session),
    },
    body,
  });

  if (!response.ok) throw new Error(`insertRecord falló: ${response.status}`);
  const text = (await response.text()).trim();
  console.log(`[SolvedCargo] insertRecord response=${text}`);
  return text;
}

// ============================================
// 4. FLUJO COMPLETO: Crear envío CPK
// ============================================
export interface ShipmentFormData {
  // Remitente (Shipper)
  sname: string;
  sphone: string;
  saddress: string;
  semail: string;
  // Destinatario (Consignee)
  cname: string;
  cidentity: string;
  cphone: string;
  caddress: string;
  cprovince: string;
  // Envío
  weight: string;
  npieces: string;
  description: string;
  cnotes: string;
}

export interface ShipmentResult {
  success: boolean;
  shipperId?: string;
  consigneeId?: string;
  reserveId?: string;
  message: string;
  error?: string;
}

export async function createFullShipment(data: ShipmentFormData): Promise<ShipmentResult> {
  let session: SolvedCargoSession;
  try {
    session = await login();
    const isValid = await checkSession(session);
    if (!isValid) {
      cachedSession = null;
      session = await login();
    }
  } catch (e) {
    return {
      success: false,
      message: "Error de conexión con SolvedCargo",
      error: e instanceof Error ? e.message : "Desconocido",
    };
  }

  try {
    // ---- PASO 1: Insertar SHIPPER (embarcador) ----
    // Schema (10 columnas, confirmado via API getNewRow):
    // [0]="" [1]=name [2]=address [3]=passport [4]=phone
    // [5]=birthday [6]=nacionality [7]=email [8]=observation [9]=identerprise
    const shipperName = sanitize(data.sname || "CHAMBATINA MIAMI");
    const shipperAddr = sanitize(data.saddress || "MIAMI FL USA");
    const shipperPhone = sanitize(data.sphone || "");
    const shipperEmail = sanitize(data.semail || "");

    const shipperParams = `;${shipperName};${shipperAddr};;${shipperPhone};;USA;${shipperEmail};${session.identerprise}`;
    console.log(`[SolvedCargo] Creando shipper: ${data.sname}`);
    const shipperId = await insertRecord(session, "shipper", shipperParams);
    console.log(`[SolvedCargo] Shipper creado: ID=${shipperId}`);

    // ---- PASO 2: Insertar CONSIGNEE (destinatario) ----
    // Schema (21 columnas, confirmado via API getNewRow):
    // [0]="" [1]=firstname [2]=secondname [3]=surname [4]=sndsurname
    // [5]=passport [6]=identity [7]=nacionality [8]=telephone [9]=mobile
    // [10]=street [11]=building [12]=between1 [13]=between2
    // [14]=apartment [15]=floor [16]=idmunicipality [17]=idprovince
    // [18]=email [19]=observation [20]=identerprise
    const parts = data.cname.toUpperCase().trim().split(/\s+/);
    const firstname = sanitize(parts[0] || "");
    const secondname = sanitize(parts[1] || "");
    const surname = sanitize(parts[2] || "");
    const sndsurname = sanitize(parts.slice(3).join(" ") || "");
    const identity = sanitize(data.cidentity);
    const phone = sanitize(data.cphone);
    const street = sanitize(data.caddress);
    const province = sanitize(data.cprovince || "");

    const consigneeParams = [
      "",           // [0] idconsignee (auto)
      firstname,    // [1] firstname
      secondname,   // [2] secondname
      surname,      // [3] surname
      sndsurname,   // [4] sndsurname
      "",           // [5] passport
      identity,     // [6] identity
      "",           // [7] nacionality
      phone,        // [8] telephone
      "",           // [9] mobile
      street,       // [10] street
      "",           // [11] building
      "",           // [12] between1
      "",           // [13] between2
      "",           // [14] apartment
      "",           // [15] floor
      "",           // [16] idmunicipality
      province,     // [17] idprovince
      "",           // [18] email
      "",           // [19] observation
      session.identerprise, // [20] identerprise
    ].join(";");
    console.log(`[SolvedCargo] Creando consignee: ${data.cname}`);
    const consigneeId = await insertRecord(session, "consignee", consigneeParams);
    console.log(`[SolvedCargo] Consignee creado: ID=${consigneeId}`);

    // ---- PASO 3: Insertar RESERVE (envío) ----
    // Columnas reales de la tabla reserve (25 columnas, confirmado via SQL del error):
    // [0]idreserve [1]identerprise [2]iduser [3]hbl [4]idfbcnumber [5]idfbcguide
    // [6]idclasification [7]goods [8]bagnumber [9]datereserve [10]idpurchaser
    // [11]idconsignee [12]idshipper [13]multhouse [14]valuebill [15]valuedoc
    // [16]quantity [17]weight [18]volume [19]value [20]idtypecorrespond
    // [21]idguidekind [22]observation [23]whnumber [24]entrydate
    const goods = sanitize(data.description || "ENVIO");
    const quantity = data.npieces || "1";
    const weight = data.weight || "1";
    const observation = sanitize(data.cnotes || "");
    const today = new Date().toISOString().split("T")[0];

    const reserveParams = [
      "",                    // [0] idreserve (auto)
      session.identerprise,  // [1] identerprise
      AUTH.iduser,           // [2] iduser
      "",                    // [3] hbl (auto-generated CPK para typecorrespond=4)
      "",                    // [4] idfbcnumber
      "",                    // [5] idfbcguide
      "44",                  // [6] idclasification (ID=44 = "ENVIO" en la tabla clasification)
      goods,                 // [7] goods/mercancía
      "",                    // [8] bagnumber
      today,                 // [9] datereserve
      "",                    // [10] idpurchaser
      consigneeId,           // [11] idconsignee
      shipperId,             // [12] idshipper
      "0",                   // [13] multhouse
      "0",                   // [14] valuebill
      "0",                   // [15] valuedoc
      quantity,              // [16] quantity
      weight,                // [17] weight
      "0",                   // [18] volume
      "0",                   // [19] value
      "4",                   // [20] idtypecorrespond (4 = FBC/CPK)
      "",                    // [21] idguidekind
      observation,           // [22] observation
      "",                    // [23] whnumber
      today,                 // [24] entrydate
    ].join(";");

    console.log(`[SolvedCargo] Creando reserve: goods=${data.description} weight=${data.weight}`);
    const reserveId = await insertRecord(session, "reservef", reserveParams);
    console.log(`[SolvedCargo] Reserve creado: ID=${reserveId}`);

    return {
      success: true,
      shipperId,
      consigneeId,
      reserveId,
      message: `Envío registrado en SolvedCargo (ID: ${reserveId}). El número CPK se generará automáticamente.`,
    };
  } catch (e) {
    return {
      success: false,
      message: "Error al crear el envío en SolvedCargo",
      error: e instanceof Error ? e.message : "Desconocido",
    };
  }
}

// ============================================
// 5. BUSCAR ENVÍOS (parsear HTML)
// ============================================
import * as cheerio from "cheerio";

export async function searchShipments(
  session: SolvedCargoSession,
  whereClause: string,
  option: string = "reservef"
): Promise<Record<string, string>[]> {
  const body = new URLSearchParams({
    funcname: "getListRecord",
    option,
    kind: "list",
    idrecord: "-1",
    where: whereClause,
    orderby: "",
    offset: "-1",
    onlytable: "1",
  });

  const response = await fetch(API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: buildCookie(session),
    },
    body: body.toString(),
  });

  const html = await response.text();
  return parseHTMLRows(html);
}

export function parseHTMLRows(html: string): Record<string, string>[] {
  const $ = cheerio.load(html);
  const rows: Record<string, string>[] = [];

  $("tr[id^='id_tr_']").each((_i, el) => {
    const row: Record<string, string> = {};
    $(el).find("td[id^='id_td_']").each((_j, td) => {
      const tdId = $(td).attr("id") || "";
      const parts = tdId.replace("id_td_", "").split("_");
      const fieldName = parts.slice(0, parts.length - 3).join("_");
      const value = $(td).attr("title") || $(td).text().trim();
      if (fieldName && value) row[fieldName] = value;
    });
    if (Object.keys(row).length > 0) rows.push(row);
  });

  return rows;
}

// ============================================
// UTILIDADES
// ============================================
export async function withSession<T>(
  fn: (session: SolvedCargoSession) => Promise<T>
): Promise<T> {
  let session = await login();
  const isValid = await checkSession(session);
  if (!isValid) {
    cachedSession = null;
    session = await login();
  }
  return fn(session);
}
