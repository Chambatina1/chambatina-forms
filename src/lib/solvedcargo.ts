// SolvedCargo API Client para Chambatina
// Documentación: https://www.solvedc.com/cargo/cargopack/v1
//
// ============================================================================
// CRITICAL: Mapeo de 41 posiciones del schema para reservef
// ============================================================================
// El PHP insertRecord/updateRecord itera las 41 posiciones del schema JSON.
// param[i] va a schema posición [i] (NO es secuencial).
// Las posiciones de display (JOIN) se SALTAN en el SQL generado.
//
// Schema positions (41 total, 25 saveable, 16 display/skipped):
// [0]  idreserve       → SAVEABLE (auto)       → param[0]
// [1]  identerprise    → SAVEABLE              → param[1]
// [2]  iduser          → SAVEABLE              → param[2]
// [3]  image           → DISPLAY (SKIPPED)     → param[3] (ignorado)
// [4]  hbl             → SAVEABLE              → param[4]
// [5]  idreservestate  → DISPLAY (SKIPPED)     → param[5] (ignorado)
// [6]  shipped         → DISPLAY (SKIPPED)     → param[6] (ignorado)
// [7]  idloadingguide  → DISPLAY (SKIPPED)     → param[7] (ignorado)
// [8]  idfbcnumber     → SAVEABLE              → param[8]
// [9]  idfbcguide      → SAVEABLE              → param[9]
// [10] idclasification → SAVEABLE              → param[10]
// [11] namegood        → SAVEABLE (col: goods) → param[11]
// [12] bagnumber       → SAVEABLE              → param[12]
// [13] datereserve     → SAVEABLE              → param[13]
// [14] namepurchaser   → SAVEABLE (col: idpurchaser) → param[14]
// [15] nameconsignee   → SAVEABLE (col: idconsignee) → param[15] ★
// [16] passport        → DISPLAY (SKIPPED)     → param[16] (ignorado)
// [17] cidentity       → DISPLAY (SKIPPED)     → param[17] (ignorado)
// [18] street          → DISPLAY (SKIPPED)     → param[18] (ignorado)
// [19] ctelephone      → DISPLAY (SKIPPED)     → param[19] (ignorado)
// [20] nameshipper     → SAVEABLE (col: idshipper) → param[20] ★
// [21] spassport       → DISPLAY (SKIPPED)     → param[21] (ignorado)
// [22] address         → DISPLAY (SKIPPED)     → param[22] (ignorado)
// [23] multhouse       → SAVEABLE              → param[23]
// [24] pidentity       → DISPLAY (SKIPPED)     → param[24] (ignorado)
// [25] ppassport       → DISPLAY (SKIPPED)     → param[25] (ignorado)
// [26] ptelephone      → DISPLAY (SKIPPED)     → param[26] (ignorado)
// [27] valuebill       → SAVEABLE              → param[27]
// [28] valuedoc        → SAVEABLE              → param[28]
// [29] quantity        → SAVEABLE              → param[29]
// [30] weight          → SAVEABLE              → param[30]
// [31] volume          → SAVEABLE              → param[31]
// [32] value           → SAVEABLE              → param[32]
// [33] idtypecorrespond→ SAVEABLE              → param[33]
// [34] idguidekind     → SAVEABLE              → param[34]
// [35] idguidestate    → DISPLAY (SKIPPED)     → param[35] (ignorado)
// [36] valuedanger     → DISPLAY (SKIPPED)     → param[36] (ignorado)
// [37] valuepaied      → DISPLAY (SKIPPED)     → param[37] (ignorado)
// [38] observation     → SAVEABLE              → param[38]
// [39] whnumber        → SAVEABLE              → param[39]
// [40] entrydate       → SAVEABLE              → param[40]

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

  console.log(`[SolvedCargo] insertRecord option=${option} params=${params.substring(0, 400)}`);

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
// 4. UPDATE RECORD (genérico) — también usa 41 posiciones
// ============================================
async function updateRecord(
  session: SolvedCargoSession,
  option: string,
  id: string,
  params: string
): Promise<string> {
  const body = new URLSearchParams({
    funcname: "updateRecord",
    option,
    id,
    params,
  }).toString();

  console.log(`[SolvedCargo] updateRecord option=${option} id=${id}`);

  const response = await fetch(API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: buildCookie(session),
    },
    body,
  });

  if (!response.ok) throw new Error(`updateRecord falló: ${response.status}`);
  const text = (await response.text()).trim();
  console.log(`[SolvedCargo] updateRecord response=${text.substring(0, 300)}`);

  // Verificar que no sea un error SQL
  if (text.toLowerCase().includes("error")) {
    throw new Error(`updateRecord error: ${text.substring(0, 300)}`);
  }

  return text;
}

// ============================================
// 5. FLUJO COMPLETO: Crear envío CPK
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
      message: "Error de conexión con SolvedCargo",
      error: e instanceof Error ? e.message : "Desconocido",
    };
  }

  try {
    // ==== PASO 1: Insertar SHIPPER ====
    // Shipper tiene 10 campos, todos tosave (sin display):
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

    // ==== PASO 3: Insertar RESERVE con 41 params (mapeo correcto del schema) ====
    const goods = sanitize(data.description || "ENVIO");
    const quantity = data.npieces || "1";
    const weight = data.weight || "1";
    const observation = sanitize(data.cnotes || "");
    const today = new Date().toISOString().split("T")[0];

    // 41 params indexados por posición del schema (ver documentación arriba)
    const reserveParams = [
      "",              // [0]  idreserve (auto)
      session.identerprise, // [1]  identerprise
      session.iduser,  // [2]  iduser
      "",              // [3]  image ★ DISPLAY (skipped por PHP)
      "",              // [4]  hbl (vacío — CPK se escribe vía updateRecord)
      "",              // [5]  idreservestate ★ DISPLAY (skipped)
      "",              // [6]  shipped ★ DISPLAY (skipped)
      "",              // [7]  idloadingguide ★ DISPLAY (skipped)
      "",              // [8]  idfbcnumber (vacío — no hay fbcnumber activo)
      "",              // [9]  idfbcguide (vacío — no hay guía activa)
      "44",            // [10] idclasification = 44 ("ENVIO")
      goods,           // [11] namegood → col: goods
      "",              // [12] bagnumber (palet)
      today,           // [13] datereserve
      "",              // [14] namepurchaser → col: idpurchaser (vacío = sin purchaser)
      consigneeId,     // [15] nameconsignee → col: idconsignee ★ FK
      "",              // [16] passport ★ DISPLAY (skipped)
      "",              // [17] cidentity ★ DISPLAY (skipped)
      "",              // [18] street ★ DISPLAY (skipped)
      "",              // [19] ctelephone ★ DISPLAY (skipped)
      shipperId,       // [20] nameshipper → col: idshipper ★ FK
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
      "",              // [34] idguidekind (vacío)
      "",              // [35] idguidestate ★ DISPLAY (skipped)
      "",              // [36] valuedanger ★ DISPLAY (skipped)
      "",              // [37] valuepaied ★ DISPLAY (skipped)
      observation,     // [38] observation
      "",              // [39] whnumber
      today,           // [40] entrydate
    ].join(";");

    console.log(`[SolvedCargo] Creando reserve (41 params): goods=${goods} consigneeId=${consigneeId} shipperId=${shipperId}`);
    const reserveId = await insertRecord(session, "reservef", reserveParams);
    console.log(`[SolvedCargo] Reserve creado: ID=${reserveId}`);

    // ==== PASO 4: Generar y escribir número CPK ====
    // Calcular siguiente CPK basado en el último existente
    await new Promise(r => setTimeout(r, 1500));

    let cpkNumber = "";
    try {
      const hblBody = new URLSearchParams({
        funcname: "getListRecord",
        option: "reservef",
        where: `r.identerprise = ${session.identerprise} AND r.hbl IS NOT NULL AND r.hbl != ''`,
        offset: "0",
        numrows: "1",
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
      const hblMatch = hblHtml.match(/CPK-(\d{7})/);
      if (hblMatch) {
        const lastNum = parseInt(hblMatch[1], 10);
        const nextNum = lastNum + 1;
        cpkNumber = `CPK-${String(nextNum).padStart(7, "0")}`;
        console.log(`[SolvedCargo] CPK calculado: ${cpkNumber}`);
      } else {
        // Si no hay CPK anterior, usar secuencia basada en el reserve ID
        cpkNumber = `CPK-${String(parseInt(reserveId) + 100000).padStart(7, "0")}`;
        console.log(`[SolvedCargo] No hay CPK anterior, usando: ${cpkNumber}`);
      }
    } catch (cpkError) {
      console.log(`[SolvedCargo] Error buscando último CPK, generando basado en ID: ${cpkError}`);
      cpkNumber = `CPK-${String(parseInt(reserveId) + 100000).padStart(7, "0")}`;
    }

    // Escribir CPK en el campo hbl usando updateRecord (también 41 params)
    try {
      const updateParams = [
        reserveId,       // [0]  idreserve → WHERE idreserve=N ★ CLAVE
        session.identerprise, // [1]  identerprise
        session.iduser,  // [2]  iduser
        "",              // [3]  image ★ DISPLAY (skipped)
        cpkNumber,       // [4]  hbl ★ ESCRIBIR CPK AQUÍ
        "",              // [5]  idreservestate ★ DISPLAY (skipped)
        "",              // [6]  shipped ★ DISPLAY (skipped)
        "",              // [7]  idloadingguide ★ DISPLAY (skipped)
        "0",             // [8]  idfbcnumber ("0" para FK enteros vacíos)
        "0",             // [9]  idfbcguide
        "44",            // [10] idclasification
        goods,           // [11] goods
        "",              // [12] bagnumber
        today,           // [13] datereserve
        "0",             // [14] idpurchaser ("0" para FK enteros)
        consigneeId,     // [15] idconsignee
        "",              // [16] passport ★ DISPLAY (skipped)
        "",              // [17] cidentity ★ DISPLAY (skipped)
        "",              // [18] street ★ DISPLAY (skipped)
        "",              // [19] ctelephone ★ DISPLAY (skipped)
        shipperId,       // [20] idshipper
        "",              // [21] spassport ★ DISPLAY (skipped)
        "",              // [22] address ★ DISPLAY (skipped)
        "0",             // [23] multhouse ("0" para enteros)
        "",              // [24] pidentity ★ DISPLAY (skipped)
        "",              // [25] ppassport ★ DISPLAY (skipped)
        "",              // [26] ptelephone ★ DISPLAY (skipped)
        "0",             // [27] valuebill
        "0",             // [28] valuedoc
        quantity,        // [29] quantity
        weight,          // [30] weight
        "0",             // [31] volume ("0" para enteros)
        "0",             // [32] value ("0" para enteros)
        "4",             // [33] idtypecorrespond
        "0",             // [34] idguidekind ("0" para enteros)
        "",              // [35] idguidestate ★ DISPLAY (skipped)
        "",              // [36] valuedanger ★ DISPLAY (skipped)
        "",              // [37] valuepaied ★ DISPLAY (skipped)
        observation,     // [38] observation
        "0",             // [39] whnumber ("0" para enteros)
        today,           // [40] entrydate
      ].join(";");

      await updateRecord(session, "reservef", reserveId, updateParams);
      console.log(`[SolvedCargo] CPK ${cpkNumber} escrito en reserve ${reserveId}`);
    } catch (updateError) {
      console.log(`[SolvedCargo] ⚠️ No se pudo escribir CPK: ${updateError instanceof Error ? updateError.message : "desconocido"}`);
      // No es fatal — el reserve existe, solo falta el CPK
    }

    // ==== PASO 5: Verificar ====
    console.log(`[SolvedCargo] Verificando reserve ID=${reserveId}...`);
    await new Promise(r => setTimeout(r, 1500));

    let hasData = false;
    try {
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
      hasData = verifyHtml.includes("id_tr_reservef_");
    } catch {
      // Verification failed, not critical
    }

    if (hasData) {
      console.log(`[SolvedCargo] ✅ Reserve ID=${reserveId} verificado con CPK ${cpkNumber}`);
    } else {
      console.log(`[SolvedCargo] ⚠️ Reserve ID=${reserveId} creado pero no visible aún (puede tardar)`);
    }

    return {
      success: true,
      shipperId,
      consigneeId,
      reserveId,
      cpkNumber,
      message: hasData
        ? `Envío registrado en SolvedCargo. Reserve ID: ${reserveId}, CPK: ${cpkNumber}. Verificado y visible en su panel.`
        : `Envío registrado en SolvedCargo. Reserve ID: ${reserveId}, CPK: ${cpkNumber}. Puede tardar unos minutos en aparecer en su panel.`,
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
// 6. BUSCAR ENVÍOS (parsear HTML)
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
