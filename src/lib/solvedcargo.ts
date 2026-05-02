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

// IDs numéricos de provincia y municipio en SolvedCargo (FK)
const PROVINCE_IDS: Record<string, number> = {
  "PINAR DEL RIO": 1, "ARTEMISA": 2, "MAYABEQUE": 3, "LA HABANA": 4,
  "MATANZAS": 5, "VILLA CLARA": 6, "CIENFUEGOS": 7, "SANCTI SPIRITUS": 8,
  "CIEGO DE AVILA": 9, "CAMAGUEY": 10, "LAS TUNAS": 11, "HOLGUIN": 12,
  "GRANMA": 13, "SANTIAGO DE CUBA": 14, "GUANTANAMO": 15, "ISLA DE LA JUVENTUD": 16,
};

const MUNICIPALITY_IDS: Record<string, Record<string, number>> = {
  "PINAR DEL RIO": { "PINAR DEL RIO": 2, "CONSOLACION DEL SUR": 3, "SAN JUAN Y MARTINEZ": 4, "LOS PALACIOS": 5, "SANDINO": 6, "GUANE": 7, "LA PALMA": 8, "SAN LUIS": 9, "MINAS DE MATAHAMBRE": 10, "VINALES": 11, "MANTUA": 12 },
  "ARTEMISA": { "MARIEL": 13, "GUANAJAY": 14, "CAIMITO": 15, "BAUTA": 16, "SAN ANTONIO DE LOS BANOS": 17, "GUIRA DE MELENA": 18, "ALQUIZAR": 19, "ARTEMISA": 20, "BAHIA HONDA": 21, "CANDELARIA": 22, "SAN CRISTOBAL": 23 },
  "LA HABANA": { "GUANABACOA": 1, "ARROYO NARANJO": 24, "BOYEROS": 25, "CENTRO HABANA": 26, "CERRO": 27, "COTORRO": 28, "DIEZ DE OCTUBRE": 29, "HABANA DEL ESTE": 30, "LA HABANA VIEJA": 31, "LA LISA": 32, "MARIANAO": 33, "PLAYA": 34, "PLAZA": 35, "REGLA": 36, "SAN MIGUEL DEL PADRON": 37 },
  "MAYABEQUE": { "BEJUCAL": 38, "SAN JOSE DE LAS LAJAS": 39, "JARUCO": 40, "SANTA CRUZ DEL NORTE": 41, "MADRUGA": 42, "NUEVA PAZ": 43, "SAN NICOLAS DE BARI": 44, "GUINES": 45, "MELENA DEL SUR": 46, "BATABANO": 47, "QUIVICAN": 48 },
  "MATANZAS": { "CALIMETE": 49, "CARDENAS": 50, "CIENAGA DE ZAPATA": 51, "COLON": 52, "JAGUEY GRANDE": 53, "JOVELLANOS": 54, "LIMONAR": 55, "LOS ARABOS": 56, "MARTI": 57, "MATANZAS": 58, "PEDRO BETANCOURT": 59, "PERICO": 60, "UNION DE REYES": 61 },
  "CIENFUEGOS": { "ABREUS": 62, "AGUADA DE PASAJEROS": 63, "CIENFUEGOS": 64, "CRUCES": 65, "CUMANAYAGUA": 66, "LAJAS": 67, "PALMIRA": 68, "RODAS": 69 },
  "VILLA CLARA": { "CAIBARIEN": 70, "CAMAJUANI": 71, "CIFUENTES": 72, "CORRALILLO": 73, "ENCRUCIJADA": 74, "MANICARAGUA": 75, "PLACETAS": 76, "QUEMADO DE GUINES": 77, "RANCHUELO": 78, "REMEDIOS": 79, "SAGUA LA GRANDE": 80, "SANTA CLARA": 81, "SANTO DOMINGO": 82 },
  "SANCTI SPIRITUS": { "SANCTI SPIRITUS": 83, "TRINIDAD": 84, "CABAIGUAN": 85, "YAGUAJAY": 86, "JATIBONICO": 87, "TAGUASCO": 88, "FOMENTO": 89, "LA SIERPE": 90 },
  "CIEGO DE AVILA": { "CIEGO DE AVILA": 91, "MORON": 92, "CHAMBAS": 93, "CIRO REDONDO": 94, "MAJAGUA": 95, "FLORENCIA": 96, "BARAGUA": 98, "PRIMERO DE ENERO": 99, "BOLIVIA": 100, "VENEZUELA": 175 },
  "CAMAGUEY": { "CAMAGUEY": 97, "BOLIVIA": 100, "GUAIMARO": 101, "NUEVITAS": 102, "CESPEDES": 103, "JIMAGUAYU": 104, "SIBANICU": 105, "ESMERALDA": 106, "MINAS": 107, "SIERRA DE CUBITAS": 108, "FLORIDA": 109, "NAJASA": 110, "VERTIENTES": 111, "SANTA CRUZ DEL SUR": 112 },
  "LAS TUNAS": { "AMANCIO": 113, "COLOMBIA": 114, "JESUS MENENDEZ": 115, "JOBABO": 116, "MAJIBACOA": 117, "MANATI": 118, "LAS TUNAS": 120, "PUERTO PADRE": 167 },
  "HOLGUIN": { "ANTILLA": 121, "BAGUANOS": 122, "BANES": 123, "CACOCUM": 124, "CALIXTO GARCIA": 125, "CUETO": 126, "FRANK PAIS": 127, "GIBARA": 128, "HOLGUIN": 129, "MAYARI": 130, "MOA": 131, "RAFAEL FREYRE": 132, "SAGUA DE TANAMO": 133, "URBANO NORIS": 134 },
  "GRANMA": { "BARTOLOME MASO": 135, "BAYAMO": 136, "BUEY ARRIBA": 137, "CAMPECHUELA": 138, "CAUTO CRISTO": 139, "GUISA": 140, "JIGUANI": 141, "MANZANILLO": 142, "MEDIA LUNA": 143, "NIQUERO": 144, "PILON": 145, "RIO CAUTO": 146, "YARA": 147 },
  "SANTIAGO DE CUBA": { "CONTRAMAESTRE": 148, "GUAMA": 149, "MELLA": 150, "PALMA SORIANO": 151, "SAN LUIS": 152, "SANTIAGO DE CUBA": 153, "SEGUNDO FRENTE": 154, "SONGO-LA MAYA": 155, "TERCER FRENTE": 156 },
  "GUANTANAMO": { "BARACOA": 157, "CAIMANERA": 158, "EL SALVADOR": 159, "GUANTANAMO": 160, "IMIAS": 161, "MAISI": 162, "MANUEL TAMES": 163, "NICETO PEREZ": 164, "SAN ANTONIO DEL SUR": 165, "YATERAS": 166 },
  "ISLA DE LA JUVENTUD": { "ISLA DE LA JUVENTUD": 171, "GERONA": 172, "LA FE": 174 },
};

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
  sbirthday: string;
  snacionality: string;
  // Destinatario (Consignee)
  cname: string;
  cidentity: string;
  cphone: string;
  caddress: string;
  cprovince: string;
  cmunicipality: string;
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
      data.sbirthday || "2000-01-01", // [5] birthday
      data.snacionality || "USA",     // [6] nacionality
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
    const consigneeParams = [
      "",              // [0] idconsignee (auto)
      data.cname.toUpperCase().trim(),  // [1] firstname (FULL NAME, no split)
      "",              // [2] secondname (empty)
      "",              // [3] surname (empty)
      "",              // [4] sndsurname (empty)
      "",              // [5] passport
      sanitize(data.cidentity),  // [6] identity
      "",              // [7] nacionality
      sanitize(data.cphone),     // [8] telephone
      "",              // [9] mobile
      sanitize(data.caddress || ""), // [10] street
      "",              // [11] building
      "",              // [12] between1
      "",              // [13] between2
      "",              // [14] apartment
      "",              // [15] floor
      String(MUNICIPALITY_IDS[data.cprovince]?.[data.cmunicipality] || ""),  // [16] idmunicipality (FK numerico)
      String(PROVINCE_IDS[data.cprovince] || ""),                        // [17] idprovince (FK numerico)
      "",              // [18] email
      "",              // [19] observation
      session.identerprise,      // [20] identerprise
    ].join(";");

    console.log(`[SolvedCargo] Creando consignee: ${data.cname.toUpperCase().trim()} identity=${data.cidentity}`);
    const consigneeId = await insertRecord(session, "consignee", consigneeParams);
    console.log(`[SolvedCargo] Consignee creado: ID=${consigneeId}`);

    // ==== PASO 3: Insertar RESERVE (envío) ====
    //
    // CRITICAL: El PHP insertRecord itera las 41 posiciones del schema.
    // Solo consume params para los 25 campos "saveable" (los demás son JOINs/display y los SALTA).
    // Por eso se deben enviar EXACTAMENTE 25 params, en el orden de los saveable fields:
    //
    // param[0]  = idreserve (auto)
    // param[1]  = identerprise
    // param[2]  = iduser
    // param[3]  = hbl (se deja vacío, se genera CPK después)
    // param[4]  = idfbcnumber
    // param[5]  = idfbcguide = "3" (ENVIOS FACTURADOS)
    // param[6]  = idclasification = "44" (ENVIO)
    // param[7]  = goods / mercancía (schema: namegood)
    // param[8]  = bagnumber
    // param[9]  = datereserve
    // param[10] = idpurchaser (vacío)
    // param[11] = idconsignee (FK al consignee insertado)
    // param[12] = idshipper (FK al shipper insertado)
    // param[13] = multhouse
    // param[14] = valuebill
    // param[15] = valuedoc
    // param[16] = quantity
    // param[17] = weight
    // param[18] = volume
    // param[19] = value
    // param[20] = idtypecorrespond = "4" (FBC/CPK)
    // param[21] = idguidekind = "3" (Master)
    // param[22] = observation
    // param[23] = whnumber
    // param[24] = entrydate
    //
    const goods = sanitize(data.description || "ENVIO");
    const quantity = data.npieces || "1";
    const weight = data.weight || "1";
    const observation = sanitize(data.cnotes || "");
    const today = new Date().toISOString().split("T")[0];

    const reserveParams = [
      "",                    // [0]  idreserve (auto-increment)
      session.identerprise,  // [1]  identerprise
      session.iduser,        // [2]  iduser
      "",                    // [3]  hbl (vacío — CPK se genera por el sistema)
      "",                    // [4]  idfbcnumber (vacío)
      "3",                   // [5]  idfbcguide = 3 ("ENVIOS FACTURADOS") ★ CLAVE
      "44",                  // [6]  idclasification = 44 ("ENVIO") ★ CLAVE
      goods,                 // [7]  goods / mercancía
      "",                    // [8]  bagnumber
      today,                 // [9]  datereserve (requerido, NOT NULL)
      "",                    // [10] idpurchaser (vacío)
      consigneeId,           // [11] idconsignee (FK al consignee insertado)
      shipperId,             // [12] idshipper (FK al shipper insertado)
      "",                    // [13] multhouse
      "0",                   // [14] valuebill (NOT NULL, default 0)
      "0",                   // [15] valuedoc (NOT NULL, default 0)
      quantity,              // [16] quantity
      weight,                // [17] weight
      "",                    // [18] volume
      "",                    // [19] value
      "4",                   // [20] idtypecorrespond = 4 (FBC/CPK) ★ REQUERIDO
      "3",                   // [21] idguidekind = 3 ("Master") ★ CLAVE
      observation,           // [22] observation
      "",                    // [23] whnumber
      today,                 // [24] entrydate
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
