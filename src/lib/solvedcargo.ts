// SolvedCargo API Client para Chambatina
// Documentacion: https://www.solvedc.com/cargo/cargopack/v1
//
// ============================================================================
// CRITICAL: Mapeo de 41 posiciones del schema para reservef
// ============================================================================
// El PHP insertRecord/updateRecord itera las 41 posiciones del schema JSON.
// param[i] va a schema posicion [i] (NO es secuencial).
// Las posiciones de display (JOIN) se SALTAN en el SQL generado.
//
// SQL generado por PHP (25 columnas saveable):
// INSERT INTO reserve (idreserve,identerprise,iduser,hbl,idfbcnumber,
//   idfbcguide,idclasification,goods,bagnumber,datereserve,idpurchaser,
//   idconsignee,idshipper,multhouse,valuebill,valuedoc,quantity,weight,
//   volume,value,idtypecorrespond,idguidekind,observation,whnumber,entrydate)
//
// Schema positions (41 total, 25 saveable, 16 display/skipped):
// [0]  idreserve       -> SAVEABLE (auto)       -> param[0]
// [1]  identerprise    -> SAVEABLE              -> param[1]
// [2]  iduser          -> SAVEABLE              -> param[2]
// [3]  image           -> DISPLAY (SKIPPED)     -> param[3] (ignorado)
// [4]  hbl             -> SAVEABLE              -> param[4]  ★ CPK va aqui
// [5]  idreservestate  -> DISPLAY (SKIPPED)     -> param[5] (ignorado)
// [6]  shipped         -> DISPLAY (SKIPPED)     -> param[6] (ignorado)
// [7]  idloadingguide  -> DISPLAY (SKIPPED)     -> param[7] (ignorado)
// [8]  idfbcnumber     -> SAVEABLE              -> param[8]
// [9]  idfbcguide      -> SAVEABLE              -> param[9]
// [10] idclasification -> SAVEABLE              -> param[10]
// [11] namegood        -> SAVEABLE (col: goods) -> param[11]
// [12] bagnumber       -> SAVEABLE              -> param[12]
// [13] datereserve     -> SAVEABLE              -> param[13]
// [14] namepurchaser   -> SAVEABLE (col: idpurchaser) -> param[14]
// [15] nameconsignee   -> SAVEABLE (col: idconsignee) -> param[15]  ★ FK
// [16] passport        -> DISPLAY (SKIPPED)     -> param[16] (ignorado)
// [17] cidentity       -> DISPLAY (SKIPPED)     -> param[17] (ignorado)
// [18] street          -> DISPLAY (SKIPPED)     -> param[18] (ignorado)
// [19] ctelephone      -> DISPLAY (SKIPPED)     -> param[19] (ignorado)
// [20] nameshipper     -> SAVEABLE (col: idshipper) -> param[20]  ★ FK
// [21] spassport       -> DISPLAY (SKIPPED)     -> param[21] (ignorado)
// [22] address         -> DISPLAY (SKIPPED)     -> param[22] (ignorado)
// [23] multhouse       -> SAVEABLE              -> param[23]
// [24] pidentity       -> DISPLAY (SKIPPED)     -> param[24] (ignorado)
// [25] ppassport       -> DISPLAY (SKIPPED)     -> param[25] (ignorado)
// [26] ptelephone      -> DISPLAY (SKIPPED)     -> param[26] (ignorado)
// [27] valuebill       -> SAVEABLE              -> param[27]
// [28] valuedoc        -> SAVEABLE              -> param[28]
// [29] quantity        -> SAVEABLE              -> param[29]
// [30] weight          -> SAVEABLE              -> param[30]
// [31] volume          -> SAVEABLE              -> param[31]
// [32] value           -> SAVEABLE              -> param[32]
// [33] idtypecorrespond-> SAVEABLE              -> param[33]
// [34] idguidekind     -> SAVEABLE              -> param[34]
// [35] idguidestate    -> DISPLAY (SKIPPED)     -> param[35] (ignorado)
// [36] valuedanger     -> DISPLAY (SKIPPED)     -> param[36] (ignorado)
// [37] valuepaied      -> DISPLAY (SKIPPED)     -> param[37] (ignorado)
// [38] observation     -> SAVEABLE              -> param[38]
// [39] whnumber        -> SAVEABLE              -> param[39]
// [40] entrydate       -> SAVEABLE              -> param[40]

const BASE_URL = "https://www.solvedc.com/cargo/cargopack/v4";
const API_PATH = `${BASE_URL}/php/solved/routing.php`;

// IDs numericos de provincia y municipio en SolvedCargo (FK)
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
  token: string;
}

// Cache de sesion en memoria (dura ~25 min)
let cachedSession: {
  session: SolvedCargoSession;
  expiresAt: number;
} | null = null;

// ============================================
// 0. OBTENER TOKEN (requerido por v4)
// ============================================
async function getToken(sessionId?: string): Promise<{ token: string; phpsessid: string }> {
  console.log("[SolvedCargo] Obteniendo token...");
  const response = await fetch(API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      funcname: "getConfigData",
      lang: "es",
    }).toString(),
    redirect: "manual",
  });

  if (!response.ok) throw new Error(`getConfigData fallo: ${response.status}`);

  const setCookie = response.headers.get("set-cookie") || "";
  const match = setCookie.match(/PHPSESSID=([^;]+)/);
  const phpsessid = match ? match[1] : (sessionId || "");

  const data = await response.json();
  if (!data.token) throw new Error("No se obtuvo token de SolvedCargo v4");

  console.log(`[SolvedCargo] Token obtenido: ${data.token.substring(0, 8)}...`);
  return { token: data.token, phpsessid };
}

// ============================================
// 1. LOGIN (con token v4)
// ============================================
export async function login(): Promise<SolvedCargoSession> {
  if (cachedSession && Date.now() < cachedSession.expiresAt) {
    return cachedSession.session;
  }

  console.log("[SolvedCargo] Login v4...");

  // Paso 1: Obtener token
  const { token: cfgToken, phpsessid } = await getToken();
  if (!phpsessid) throw new Error("No se obtuvo PHPSESSID");

  // Paso 2: Login con token
  const loginParams = new URLSearchParams({
    token: cfgToken,
    funcname: "loginUser",
    user: AUTH.user,
    password: AUTH.password,
  });

  const response = await fetch(API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `PHPSESSID=${phpsessid}`,
    },
    body: loginParams.toString(),
  });

  if (!response.ok) throw new Error(`Login fallo: ${response.status}`);

  const data = await response.json();
  console.log(`[SolvedCargo] Login OK: iduser=${data.iduser} enterprise=${data.identerprise}`);
  if (!data.iduser) throw new Error("Login no devolvio datos");

  const session: SolvedCargoSession = {
    phpsessid,
    iduser: data.iduser,
    identerprise: data.identerprise,
    token: cfgToken,
  };

  cachedSession = { session, expiresAt: Date.now() + 25 * 60 * 1000 };
  return session;
}

// ============================================
// 2. VALIDAR SESION
// ============================================
export async function checkSession(session: SolvedCargoSession): Promise<boolean> {
  const body = new URLSearchParams({
    token: session.token,
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
function sanitize(value: string): string {
  return value
    .replace(/[;#&|]/g, "")   // chars problematicos para SQL
    .replace(/@/g, "");       // @ causa syntax error en MariaDB via API
}

// Valida que la respuesta es un ID numerico (no un mensaje de error)
function isValidId(response: string): { valid: boolean; id: string; error?: string } {
  const trimmed = response.trim();
  if (/^\d+$/.test(trimmed)) {
    return { valid: true, id: trimmed };
  }
  return { valid: false, id: "", error: trimmed.substring(0, 200) };
}

// ============================================
// 3. INSERT RECORD (generico)
// ============================================
async function insertRecord(
  session: SolvedCargoSession,
  option: string,
  params: string
): Promise<string> {
  const body = new URLSearchParams({
    token: session.token,
    funcname: "insertRecord",
    option,
    params,
  }).toString();

  console.log(`[SolvedCargo] insertRecord option=${option} params=${params.substring(0, 400)}`);

  const response = await fetch(API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: buildCookie(session),
    },
    body,
  });

  if (!response.ok) throw new Error(`insertRecord fallo: ${response.status}`);
  const text = (await response.text()).trim();
  console.log(`[SolvedCargo] insertRecord response=${text}`);

  // Validar que sea un ID numerico, no un error SQL
  const check = isValidId(text);
  if (!check.valid) {
    throw new Error(`insertRecord devolvio error: ${check.error}`);
  }

  return check.id;
}

// ============================================
// 3b. UPDATE RECORD (generico)
// ============================================
async function updateRecord(
  session: SolvedCargoSession,
  option: string,
  params: string
): Promise<boolean> {
  const body = new URLSearchParams({
    token: session.token,
    funcname: "updateRecord",
    option,
    params,
  }).toString();

  console.log(`[SolvedCargo] updateRecord option=${option} params=${params.substring(0, 400)}`);

  const response = await fetch(API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: buildCookie(session),
    },
    body,
  });

  if (!response.ok) throw new Error(`updateRecord fallo: ${response.status}`);
  const text = (await response.text()).trim();
  console.log(`[SolvedCargo] updateRecord response=${text}`);

  // updateRecord devuelve "1" en exito
  return text === "1" || text.includes("1");
}

// ============================================
// 4. REPARAR RESERVE con campos FK faltantes
// ============================================
export async function repairReserve(reserveId: string): Promise<{ success: boolean; message: string }> {
  let session: SolvedCargoSession;
  try {
    session = await login();
  } catch (e) {
    return { success: false, message: `Error de conexion: ${e instanceof Error ? e.message : "Desconocido"}` };
  }

  try {
    // Actualizar los campos FK faltantes usando updateRecord
    // Los params siguen el mismo formato de 41 posiciones
    const updateParams = [
      reserveId,       // [0]  idreserve ★ ID del registro a actualizar
      "55",            // [1]  identerprise
      "101",           // [2]  iduser
      "",              // [3]  image ★ DISPLAY (skipped)
      "",              // [4]  hbl (no cambiar)
      "",              // [5]  idreservestate ★ DISPLAY (skipped)
      "",              // [6]  shipped ★ DISPLAY (skipped)
      "",              // [7]  idloadingguide ★ DISPLAY (skipped)
      "11",            // [8]  idfbcnumber = 11 (ENVIOS FACTURADOS) ★ FK OBLIGATORIO
      "3",             // [9] idfbcguide = 3 (default enterprise 55) ★ FK numerico
      "",              // [10] idclasification (no cambiar)
      "",              // [11] goods (no cambiar)
      "",              // [12] bagnumber (no cambiar)
      "",              // [13] datereserve (no cambiar)
      "",              // [14] idpurchaser (no cambiar)
      "",              // [15] idconsignee (no cambiar)
      "",              // [16] passport ★ DISPLAY (skipped)
      "",              // [17] cidentity ★ DISPLAY (skipped)
      "",              // [18] street ★ DISPLAY (skipped)
      "",              // [19] ctelephone ★ DISPLAY (skipped)
      "",              // [20] idshipper (no cambiar)
      "",              // [21] spassport ★ DISPLAY (skipped)
      "",              // [22] address ★ DISPLAY (skipped)
      "",              // [23] multhouse (no cambiar)
      "",              // [24] pidentity ★ DISPLAY (skipped)
      "",              // [25] ppassport ★ DISPLAY (skipped)
      "",              // [26] ptelephone ★ DISPLAY (skipped)
      "",              // [27] valuebill (no cambiar)
      "",              // [28] valuedoc (no cambiar)
      "",              // [29] quantity (no cambiar)
      "",              // [30] weight (no cambiar)
      "",              // [31] volume (no cambiar)
      "",              // [32] value (no cambiar)
      "",              // [33] idtypecorrespond (no cambiar)
      "2",             // [34] idguidekind = 2 (Master) ★ FK numerico
      "",              // [35] idguidestate ★ DISPLAY (skipped)
      "",              // [36] valuedanger ★ DISPLAY (skipped)
      "",              // [37] valuepaied ★ DISPLAY (skipped)
      "",              // [38] observation (no cambiar)
      "",              // [39] whnumber (no cambiar)
      "",              // [40] entrydate (no cambiar)
    ].join(";");

    console.log(`[SolvedCargo] Reparando reserve ID=${reserveId} con campos FK...`);
    const ok = await updateRecord(session, "reservef", updateParams);

    if (ok) {
      // Verificar que ahora es visible
      await new Promise(r => setTimeout(r, 2000));
      const visible = await verifyReserve(session, reserveId);
      if (visible) {
        return { success: true, message: `Reserve ${reserveId} reparado y verificado en SolvedCargo` };
      }
      return { success: true, message: `Reserve ${reserveId} actualizado (puede tardar en aparecer)` };
    }

    return { success: false, message: `No se pudo actualizar reserve ${reserveId}` };
  } catch (e) {
    return { success: false, message: `Error: ${e instanceof Error ? e.message : "Desconocido"}` };
  }
}

// ============================================
// 5. BUSCAR ULTIMO CPK
// ============================================
async function getNextCPK(session: SolvedCargoSession): Promise<string> {
  const hblBody = new URLSearchParams({
    token: session.token,
    funcname: "getListRecord",
    option: "reservef",
    where: `r.identerprise = ${session.identerprise} AND r.hbl LIKE 'CPK-%'`,
    offset: "0",
    numrows: "5",
    orderby: "r.idreserve DESC",
    onlytable: "1",
  });

  const hblResponse = await fetch(API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: buildCookie(session),
    },
    body: hblBody.toString(),
  });

  const hblHtml = await hblResponse.text();

  // Buscar todos los numeros CPK en el HTML
  const cpkMatches = hblHtml.match(/CPK-(\d{7})/g);
  if (cpkMatches && cpkMatches.length > 0) {
    // Extraer numeros y encontrar el mayor
    const nums = cpkMatches.map(m => parseInt(m.replace("CPK-", ""), 10));
    const maxNum = Math.max(...nums);
    const nextNum = maxNum + 1;
    const cpk = `CPK-${String(nextNum).padStart(7, "0")}`;
    console.log(`[SolvedCargo] Ultimos CPK encontrados: ${cpkMatches.slice(0, 3).join(", ")} -> siguiente: ${cpk}`);
    return cpk;
  }

  // Fallback: buscar en TODOS los registros (no solo enterprise)
  console.log(`[SolvedCargo] No se encontraron CPK para esta enterprise, buscando global...`);
  const globalBody = new URLSearchParams({
    token: session.token,
    funcname: "getListRecord",
    option: "reservef",
    where: `r.hbl LIKE 'CPK-%'`,
    offset: "0",
    numrows: "5",
    orderby: "r.idreserve DESC",
    onlytable: "1",
  });

  const globalResponse = await fetch(API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: buildCookie(session),
    },
    body: globalBody.toString(),
  });

  const globalHtml = await globalResponse.text();
  const globalMatches = globalHtml.match(/CPK-(\d{7})/g);
  if (globalMatches && globalMatches.length > 0) {
    const nums = globalMatches.map(m => parseInt(m.replace("CPK-", ""), 10));
    const maxNum = Math.max(...nums);
    const nextNum = maxNum + 1;
    const cpk = `CPK-${String(nextNum).padStart(7, "0")}`;
    console.log(`[SolvedCargo] CPK global encontrado: ${cpk}`);
    return cpk;
  }

  // Ultimo fallback
  console.log(`[SolvedCargo] No se encontraron CPK, generando CPK-0273613`);
  return "CPK-0273613";
}

// ============================================
// 6. VERIFICAR REGISTRO EXISTE
// ============================================
async function verifyReserve(session: SolvedCargoSession, reserveId: string): Promise<boolean> {
  const verifyBody = new URLSearchParams({
    token: session.token,
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
  return verifyHtml.includes("id_tr_reservef_");
}

// ============================================
// 7. FLUJO COMPLETO: Crear envio CPK
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
  // Envio
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
  cpkNumber?: string;
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
      message: "Error de conexion con SolvedCargo",
      error: e instanceof Error ? e.message : "Desconocido",
    };
  }

  try {
    // ==== PASO 1: Insertar SHIPPER ====
    // Shipper tiene 10 campos, todos tosave (sin display):
    const shipperName = sanitize(data.sname || "CHAMBATINA MIAMI");
    const shipperAddr = "";  // Direccion Emb. debe quedar en blanco en SolvedCargo
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
    const consigneeParams = [
      "",              // [0] idconsignee (auto)
      data.cname.toUpperCase().trim(),  // [1] firstname (NOMBRE COMPLETO)
      "",              // [2] secondname
      "",              // [3] surname
      "",              // [4] sndsurname
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
      String(MUNICIPALITY_IDS[data.cprovince]?.[data.cmunicipality] || "0"),  // [16] idmunicipality
      String(PROVINCE_IDS[data.cprovince] || "0"),                        // [17] idprovince
      "",              // [18] email
      "",              // [19] observation
      session.identerprise,      // [20] identerprise
    ].join(";");

    console.log(`[SolvedCargo] Creando consignee: ${data.cname.toUpperCase().trim()}`);
    const consigneeId = await insertRecord(session, "consignee", consigneeParams);
    console.log(`[SolvedCargo] Consignee creado: ID=${consigneeId}`);

    // ==== PASO 3: Calcular CPK ANTES del insert ====
    const cpkNumber = await getNextCPK(session);
    console.log(`[SolvedCargo] CPK a usar: ${cpkNumber}`);

    // ==== PASO 4: Insertar RESERVE con 41 params + CPK incluido ====
    const goods = sanitize(data.description || "ENVIO");
    const quantity = data.npieces || "1";
    const weight = data.weight || "1";
    const observation = sanitize(data.cnotes || "");
    const today = new Date().toISOString().split("T")[0];

    // 41 params indexados por posicion del schema
    // El PHP genera SQL solo para los 25 campos SAVEABLE
    const reserveParams = [
      "",              // [0]  idreserve (auto)
      session.identerprise, // [1]  identerprise
      session.iduser,  // [2]  iduser
      "",              // [3]  image ★ DISPLAY (skipped por PHP)
      cpkNumber,       // [4]  hbl ★★★ CPK SE ESCRIBE DIRECTAMENTE AQUI ★★★
      "",              // [5]  idreservestate ★ DISPLAY (skipped)
      "",              // [6]  shipped ★ DISPLAY (skipped)
      "",              // [7]  idloadingguide ★ DISPLAY (skipped)
      "11",            // [8]  idfbcnumber = 11 (ENVIOS FACTURADOS) ★ FK OBLIGATORIO
      "3",             // [9] idfbcguide = 3 (default enterprise 55) ★ FK numerico obligatorio
      "44",            // [10] idclasification = 44 ("ENVIO")
      goods,           // [11] namegood -> col: goods
      "",              // [12] bagnumber (palet)
      today,           // [13] datereserve
      "",              // [14] namepurchaser -> col: idpurchaser (vacio)
      consigneeId,     // [15] nameconsignee -> col: idconsignee ★ FK
      "",              // [16] passport ★ DISPLAY (skipped)
      "",              // [17] cidentity ★ DISPLAY (skipped)
      "",              // [18] street ★ DISPLAY (skipped)
      "",              // [19] ctelephone ★ DISPLAY (skipped)
      shipperId,       // [20] nameshipper -> col: idshipper ★ FK
      "",              // [21] spassport ★ DISPLAY (skipped)
      "",              // [22] address ★ DISPLAY (skipped)
      "",              // [23] multhouse
      "",              // [24] pidentity ★ DISPLAY (skipped)
      "",              // [25] ppassport ★ DISPLAY (skipped)
      "",              // [26] ptelephone ★ DISPLAY (skipped)
      "0",             // [27] valuebill
      "0",             // [28] valuedoc
      quantity,        // [29] quantity
      weight,          // [30] weight
      "",              // [31] volume
      "",              // [32] value
      "4",             // [33] idtypecorrespond = 4 (FBC/CPK)
      "2",             // [34] idguidekind = 2 (Master) ★ FK numerico
      "",              // [35] idguidestate ★ DISPLAY (skipped)
      "",              // [36] valuedanger ★ DISPLAY (skipped)
      "",              // [37] valuepaied ★ DISPLAY (skipped)
      observation,     // [38] observation
      "",              // [39] whnumber
      "",              // [40] entrydate (debe quedar en blanco)
    ].join(";");

    console.log(`[SolvedCargo] Creando reserve (41 params): goods=${goods} cpk=${cpkNumber} consigneeId=${consigneeId} shipperId=${shipperId}`);
    const reserveId = await insertRecord(session, "reservef", reserveParams);
    console.log(`[SolvedCargo] Reserve creado: ID=${reserveId} con CPK=${cpkNumber}`);

    // ==== PASO 5: Verificar que el registro existe y es visible ====
    console.log(`[SolvedCargo] Verificando reserve ID=${reserveId}...`);
    await new Promise(r => setTimeout(r, 2000)); // Esperar 2s para que la BD actualice

    let hasData = false;
    try {
      hasData = await verifyReserve(session, reserveId);
    } catch {
      // Verification failed, not critical
    }

    if (hasData) {
      console.log(`[SolvedCargo] Reserve ID=${reserveId} VERIFICADO con CPK ${cpkNumber}`);
    } else {
      console.log(`[SolvedCargo] Reserve ID=${reserveId} creado pero verificacion fallo (puede tardar en aparecer)`);
    }

    return {
      success: true,
      shipperId,
      consigneeId,
      reserveId,
      cpkNumber,
      message: hasData
        ? `Envio registrado en SolvedCargo. Reserve ID: ${reserveId}, CPK: ${cpkNumber}. Verificado y visible en su panel.`
        : `Envio registrado en SolvedCargo. Reserve ID: ${reserveId}, CPK: ${cpkNumber}. Puede tardar unos minutos en aparecer en su panel.`,
    };
  } catch (e) {
    console.error(`[SolvedCargo] Error: ${e instanceof Error ? e.message : "Desconocido"}`);
    return {
      success: false,
      message: "Error al crear el envio en SolvedCargo",
      error: e instanceof Error ? e.message : "Desconocido",
    };
  }
}

// ============================================
// 8. BUSCAR ENVIOS (parsear HTML)
// ============================================
import * as cheerio from "cheerio";

export async function searchShipments(
  session: SolvedCargoSession,
  whereClause: string,
  option: string = "reservef"
): Promise<Record<string, string>[]> {
  const body = new URLSearchParams({
    token: session.token,
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
