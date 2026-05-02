// SolvedCargo API Client para Chambatina
// Documentación: https://www.solvedc.com/cargo/cargopack/v1
//
// CRITICAL: La tabla reserve tiene 41 campos en el schema JSON,
// pero solo 25 son "tosave=true" (se guardan en BD).
// El PHP insertRecord mapea los params a las 41 posiciones,
// incluyendo los 16 campos de display (JOIN) que se SALTAN.
// Por eso se deben enviar 41 params con "" en las posiciones de display.

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

// Cache de sesión en memoria (dura ~25 min)
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

// Elimina caracteres que el API SolvedCargo no maneja bien en SQL
// Nota: @ puede causar errores SQL, se reemplaza con vacío
function sanitize(value: string): string {
  return value
    .replace(/[;#&|]/g, "")   // chars problemáticos para SQL
    .replace(/@/g, "");       // @ causa syntax error en MariaDB via API
}

// Valida que la respuesta es un ID numérico (no un mensaje de error)
function isValidId(response: string): { valid: boolean; id: string; error?: string } {
  const trimmed = response.trim();
  if (/^\d+$/.test(trimmed)) {
    return { valid: true, id: trimmed };
  }
  return { valid: false, id: "", error: trimmed.substring(0, 200) };
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

  console.log(`[SolvedCargo] insertRecord option=${option} params=${params.substring(0, 300)}`);

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

  // Validar que sea un ID numérico, no un error SQL
  const check = isValidId(text);
  if (!check.valid) {
    throw new Error(`insertRecord devolvió error: ${check.error}`);
  }

  return check.id;
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
    // ==== PASO 1: Insertar SHIPPER ====
    // Shipper tiene 10 campos, todos tosave (sin campos de display):
    // [0]=idshipper(auto) [1]=name [2]=address [3]=passport [4]=phone
    // [5]=birthday [6]=nacionality [7]=email [8]=observation [9]=identerprise
    const shipperName = sanitize(data.sname || "CHAMBATINA MIAMI");
    const shipperAddr = sanitize(data.saddress || "MIAMI FL USA");
    const shipperPhone = sanitize(data.sphone || "");
    const shipperEmail = sanitize(data.semail || "");

    const shipperParams = [
      "",           // [0] idshipper (auto)
      shipperName,  // [1] name
      shipperAddr,  // [2] address
      "",           // [3] passport
      shipperPhone, // [4] phone
      "2000-01-01", // [5] birthday (fecha genérica requerida)
      "USA",        // [6] nacionality
      shipperEmail, // [7] email
      "",           // [8] observation
      session.identerprise, // [9] identerprise
    ].join(";");

    console.log(`[SolvedCargo] Creando shipper: ${shipperName}`);
    const shipperId = await insertRecord(session, "shipper", shipperParams);
    console.log(`[SolvedCargo] Shipper creado: ID=${shipperId}`);

    // ==== PASO 2: Insertar CONSIGNEE ====
    // Consignee tiene 21 campos, todos tosave:
    // [0]=idconsignee(auto) [1]=firstname [2]=secondname [3]=surname [4]=sndsurname
    // [5]=passport [6]=identity [7]=nacionality [8]=telephone [9]=mobile
    // [10]=street [11]=building [12]=between1 [13]=between2
    // [14]=apartment [15]=floor [16]=idmunicipality [17]=idprovince
    // [18]=email [19]=observation [20]=identerprise
    const nameParts = data.cname.toUpperCase().trim().split(/\s+/);
    const firstname = sanitize(nameParts[0] || "");
    const secondname = sanitize(nameParts[1] || "");
    const surname = sanitize(nameParts[2] || "");
    const sndsurname = sanitize(nameParts.slice(3).join(" ") || "");
    const identity = sanitize(data.cidentity);
    const phone = sanitize(data.cphone);
    const street = sanitize(data.caddress);

    const consigneeParams = [
      "",           // [0] idconsignee (auto)
      firstname,    // [1] firstname (requerido)
      secondname,   // [2] secondname
      surname,      // [3] surname (requerido)
      sndsurname,   // [4] sndsurname (requerido)
      "",           // [5] passport
      identity,     // [6] identity (requerido - carnet)
      "CUB",        // [7] nacionality
      phone,        // [8] telephone (requerido)
      "",           // [9] mobile
      street,       // [10] street (requerido)
      "",           // [11] building
      "",           // [12] between1
      "",           // [13] between2
      "",           // [14] apartment
      "",           // [15] floor
      "1",          // [16] idmunicipality (FK, default 1)
      "1",          // [17] idprovince (FK, default 1)
      "",           // [18] email (vacío para evitar error con @)
      "",           // [19] observation
      session.identerprise, // [20] identerprise
    ].join(";");

    console.log(`[SolvedCargo] Creando consignee: ${firstname} ${surname} identity=${identity}`);
    const consigneeId = await insertRecord(session, "consignee", consigneeParams);
    console.log(`[SolvedCargo] Consignee creado: ID=${consigneeId}`);

    // ==== PASO 3: Insertar RESERVE (envío) ====
    //
    // CRITICAL: La tabla reserve tiene 41 campos en el schema del API.
    // El PHP itera los 41 campos y para cada uno que es "tosave=true",
    // toma el siguiente param. Los campos "tosave=false" (display via JOIN)
    // se SALTAN pero still consumen posiciones en el array de params.
    //
    // Posiciones de los 41 campos:
    //   TOSAVE (25):     0, 1, 2, 4, 8, 9, 10, 11, 12, 13, 14, 15,
    //                    20, 23, 27, 28, 29, 30, 31, 32, 33, 34, 38, 39, 40
    //   DISPLAY (16):    3, 5, 6, 7, 16, 17, 18, 19, 21, 22, 24, 25, 26, 35, 36, 37
    //
    // Se deben enviar 41 params. Los display van con "" (vacío).
    //
    const goods = sanitize(data.description || "ENVIO");
    const quantity = data.npieces || "1";
    const weight = data.weight || "1";
    const observation = sanitize(data.cnotes || "");
    const today = new Date().toISOString().split("T")[0];

    const reserveParams = [
      // === TOSAVE ===
      "",                    // [0]  idreserve (auto-increment)
      session.identerprise,  // [1]  identerprise
      session.iduser,        // [2]  iduser
      // === DISPLAY (saltado por PHP, pero se necesita placeholder) ===
      "",                    // [3]  image (display only - SKIP)
      // === TOSAVE ===
      "",                    // [4]  hbl (se genera después con getHblNumber)
      // === DISPLAY ===
      "",                    // [5]  shipped (display only - SKIP)
      "",                    // [6]  idreservestate (display only - SKIP)
      "",                    // [7]  idloadingguide (display only - SKIP)
      // === TOSAVE ===
      "",                    // [8]  idfbcnumber
      "3",                   // [9]  idfbcguide = 3 ("ENVIOS FACTURADOS") ★ CLAVE
      "44",                  // [10] idclasification = 44 ("ENVIO") ★ CLAVE
      goods,                 // [11] goods / mercancía
      "",                    // [12] bagnumber
      today,                 // [13] datereserve (requerido, NOT NULL)
      "",                    // [14] idpurchaser
      consigneeId,           // [15] idconsignee (FK al consignee insertado)
      // === DISPLAY (4 campos JOIN consignee) ===
      "",                    // [16] c.passport (display only - SKIP)
      "",                    // [17] c.identity (display only - SKIP)
      "",                    // [18] c.street (display only - SKIP)
      "",                    // [19] c.telephone (display only - SKIP)
      // === TOSAVE ===
      shipperId,             // [20] idshipper (FK al shipper insertado)
      // === DISPLAY (2 campos JOIN shipper) ===
      "",                    // [21] s.passport (display only - SKIP)
      "",                    // [22] s.address (display only - SKIP)
      // === TOSAVE ===
      "",                    // [23] multhouse
      // === DISPLAY (3 campos JOIN purchaser) ===
      "",                    // [24] p.identity (display only - SKIP)
      "",                    // [25] p.passport (display only - SKIP)
      "",                    // [26] p.telephone (display only - SKIP)
      // === TOSAVE ===
      "",                    // [27] valuebill (NOT NULL, default 0)
      "",                    // [28] valuedoc (NOT NULL, default 0)
      quantity,              // [29] quantity
      weight,                // [30] weight
      "",                    // [31] volume
      "",                    // [32] value
      "4",                   // [33] idtypecorrespond = 4 (FBC/CPK) ★ REQUERIDO
      "3",                   // [34] idguidekind = 3 ("Master") ★ CLAVE
      // === DISPLAY (3 campos) ===
      "",                    // [35] idguidestate (display only - SKIP)
      "",                    // [36] valuedanger (display only - SKIP)
      "",                    // [37] valuepaied (display only - SKIP)
      // === TOSAVE ===
      observation,           // [38] observation
      "",                    // [39] whnumber
      today,                 // [40] entrydate
    ].join(";");

    console.log(`[SolvedCargo] Creando reserve: goods=${goods} consigneeId=${consigneeId} shipperId=${shipperId}`);
    const reserveId = await insertRecord(session, "reservef", reserveParams);
    console.log(`[SolvedCargo] Reserve creado: ID=${reserveId}`);

    // ==== PASO 4: Verificar que el reserve se creó correctamente ====
    console.log(`[SolvedCargo] Verificando reserve ID=${reserveId}...`);
    await new Promise(r => setTimeout(r, 2000)); // esperar propagación

    const verifyBody = new URLSearchParams({
      funcname: "getListRecord",
      option: "reservef",
      where: `r.idreserve = ${reserveId}`,
      offset: "0",
      numrows: "1",
      onlytable: "1",
    });

    const verifyResponse = await fetch(API_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: buildCookie(session),
      },
      body: verifyBody.toString(),
    });

    const verifyHtml = await verifyResponse.text();
    const hasData = verifyHtml.includes("id_tr_reservef_");

    if (hasData) {
      console.log(`[SolvedCargo] ✅ Reserve ID=${reserveId} verificado en SolvedCargo`);
    } else {
      console.log(`[SolvedCargo] ⚠️ Reserve ID=${reserveId} creado pero no visible en lista (puede tardar en aparecer)`);
    }

    return {
      success: true,
      shipperId,
      consigneeId,
      reserveId,
      message: hasData
        ? `Envío registrado en SolvedCargo (Reserve ID: ${reserveId}). Verificado y visible en su panel.`
        : `Envío registrado en SolvedCargo (Reserve ID: ${reserveId}). Puede tardar unos minutos en aparecer en su panel.`,
    };
  } catch (e) {
    console.error(`[SolvedCargo] Error: ${e instanceof Error ? e.message : "Desconocido"}`);
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
