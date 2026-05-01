// SolvedCargo API Client para Chambatina
// Documentación completa en: https://www.solvedc.com/cargo/cargopack/v1

const BASE_URL = "https://www.solvedc.com/cargo/cargopack/v1";
const API_PATH = `${BASE_URL}/php/solved/routing.php`;

// Credenciales Chambatina
const AUTH = {
  user: "GEO MIA",
  password: "GEO**091223",
  identerprise: "55",
  enterprise: "CHAMBATINA MIAMI",
};

interface SolvedCargoSession {
  phpsessid: string;
  iduser: string;
  identerprise: string;
  enterprise: string;
}

// Cache de sesión en memoria (dura ~30 min en el server de SolvedCargo)
let cachedSession: {
  session: SolvedCargoSession;
  expiresAt: number;
} | null = null;

// ============================================
// 1. LOGIN
// ============================================
export async function login(): Promise<SolvedCargoSession> {
  // Reutilizar sesión cacheada si aún es válida (25 min para margen)
  if (cachedSession && Date.now() < cachedSession.expiresAt) {
    return cachedSession.session;
  }

  const body = new URLSearchParams({
    funcname: "loginUser",
    user: AUTH.user,
    password: encodeURIComponent(AUTH.password).replace(/%2A/g, "*").replace(/%2B/g, "+"),
  });

  const response = await fetch(API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    redirect: "manual", // No seguir redirects para capturar cookie
  });

  if (!response.ok) {
    throw new Error(`Login falló con status ${response.status}`);
  }

  // Extraer PHPSESSID de la cookie
  const setCookie = response.headers.get("set-cookie") || "";
  const phpsessidMatch = setCookie.match(/PHPSESSID=([^;]+)/);
  if (!phpsessidMatch) {
    throw new Error("No se pudo obtener PHPSESSID del login");
  }

  const phpsessid = phpsessidMatch[1];

  // Parsear respuesta JSON
  const data = await response.json();

  if (!data.iduser) {
    throw new Error("Login no devolvió datos de usuario");
  }

  const session: SolvedCargoSession = {
    phpsessid,
    iduser: data.iduser,
    identerprise: data.identerprise,
    enterprise: data.enterprise,
  };

  // Cache por 25 minutos (la sesión dura 30 min)
  cachedSession = {
    session,
    expiresAt: Date.now() + 25 * 60 * 1000,
  };

  return session;
}

// ============================================
// 2. VALIDAR SESIÓN
// ============================================
export async function checkSession(session: SolvedCargoSession): Promise<boolean> {
  const body = new URLSearchParams({
    funcname: "checkIfValidSession",
    username: AUTH.user,
    password: encodeURIComponent(AUTH.password).replace(/%2A/g, "*").replace(/%2B/g, "+"),
  });

  const response = await fetch(API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `PHPSESSID=${session.phpsessid}`,
    },
    body: body.toString(),
  });

  const text = await response.text();
  // La API devuelve "1" (string), NO "true" ni boolean
  return text.trim() === "1";
}

// ============================================
// 3. OBTENER FILA NUEVA (schema del formulario)
// ============================================
export async function getNewRow(session: SolvedCargoSession, option: string = "reservef"): Promise<string> {
  const body = new URLSearchParams({
    funcname: "getNewRow",
    option,
  });

  const response = await fetch(API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `PHPSESSID=${session.phpsessid}`,
    },
    body: body.toString(),
  });

  return response.text();
}

// ============================================
// 4. INSERTAR NUEVA FILA (crear envío)
// ============================================
export async function insertRow(
  session: SolvedCargoSession,
  option: string,
  formData: Record<string, string>
): Promise<string> {
  const params = new URLSearchParams({
    funcname: "getInsertRow",
    option,
    ...formData,
  });

  const response = await fetch(API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `PHPSESSID=${session.phpsessid}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Insert falló con status ${response.status}`);
  }

  return response.text();
}

// ============================================
// 5. GUARDAR RESERVA COMPLETA
// ============================================
export async function saveReserve(
  session: SolvedCargoSession,
  formData: Record<string, string>
): Promise<string> {
  const params = new URLSearchParams({
    funcname: "saveReserve",
    ...formData,
  });

  const response = await fetch(API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `PHPSESSID=${session.phpsessid}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`SaveReserve falló con status ${response.status}`);
  }

  return response.text();
}

// ============================================
// 6. BUSCAR ENVÍOS (para verificar si se creó)
// ============================================
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
      Cookie: `PHPSESSID=${session.phpsessid}`,
    },
    body: body.toString(),
  });

  const html = await response.text();
  return parseHTMLRows(html);
}

// ============================================
// 7. OBTENER REGISTRO ESPECÍFICO
// ============================================
export async function getRecord(
  session: SolvedCargoSession,
  option: string,
  idrecord: string
): Promise<string> {
  const body = new URLSearchParams({
    funcname: "getRecord",
    option,
    idrecord,
  });

  const response = await fetch(API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `PHPSESSID=${session.phpsessid}`,
    },
    body: body.toString(),
  });

  return response.text();
}

// ============================================
// 8. OBTENER JSON SCHEMA DE TABLA
// ============================================
export async function getJsonSchema(
  session: SolvedCargoSession,
  option: string = "reservef"
): Promise<string> {
  const body = new URLSearchParams({
    funcname: "getJson",
    option,
  });

  const response = await fetch(API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `PHPSESSID=${session.phpsessid}`,
    },
    body: body.toString(),
  });

  return response.text();
}

// ============================================
// 9. OBTENER OPCIONES DE UN CAMPO
// ============================================
export async function getOptions(
  session: SolvedCargoSession,
  option: string,
  field: string
): Promise<string> {
  const body = new URLSearchParams({
    funcname: "getOptions",
    option,
    field,
  });

  const response = await fetch(API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `PHPSESSID=${session.phpsessid}`,
    },
    body: body.toString(),
  });

  return response.text();
}

// ============================================
// PARSEAR HTML (SolvedCargo devuelve HTML, no JSON)
// ============================================
import * as cheerio from "cheerio";

export function parseHTMLRows(html: string): Record<string, string>[] {
  const $ = cheerio.load(html);
  const rows: Record<string, string>[] = [];

  $("tr[id^='id_tr_']").each((_i, el) => {
    const row: Record<string, string> = {};
    $(el)
      .find("td[id^='id_td_']")
      .each((_j, td) => {
        const tdId = $(td).attr("id") || "";
        // Formato: id_td_{fieldname}_{option}_{kind}_{index}
        const parts = tdId.replace("id_td_", "").split("_");
        // El campo son los primeros N-3 partes
        const fieldName = parts.slice(0, parts.length - 3).join("_");
        const value = $(td).attr("title") || $(td).text().trim();
        if (fieldName && value) {
          row[fieldName] = value;
        }
      });
    if (Object.keys(row).length > 0) {
      rows.push(row);
    }
  });

  return rows;
}

// ============================================
// FLUJO COMPLETO: Login + Validar + Operar
// ============================================
export async function withSession<T>(
  fn: (session: SolvedCargoSession) => Promise<T>
): Promise<T> {
  let session = await login();

  // Verificar si la sesión cacheada sigue siendo válida
  const isValid = await checkSession(session);
  if (!isValid) {
    // Forzar nuevo login
    cachedSession = null;
    session = await login();
  }

  return fn(session);
}

// ============================================
// CREAR ENVÍO CPK (función principal)
// ============================================
export interface ShipmentData {
  cname: string; // Nombre del destinatario
  cidentity: string; // Carnet de identidad
  cphone?: string; // Teléfono
  caddress?: string; // Dirección
  ccity?: string; // Ciudad
  cprovince?: string; // Provincia
  weight?: string; // Peso
  npieces?: string; // Cantidad de bultos
  description?: string; // Descripción de mercancía
  cnotes?: string; // Notas adicionales
}

export async function createShipment(data: ShipmentData): Promise<{
  success: boolean;
  cpk?: string;
  message: string;
  rawResponse?: string;
}> {
  return withSession(async (session) => {
    try {
      // Primero obtener el formulario vacío para ver la estructura
      const newRowHtml = await getNewRow(session, "reservef");

      // Extraer los hidden fields del formulario (si hay)
      const $ = cheerio.load(newRowHtml);
      const hiddenFields: Record<string, string> = {};

      $("input[type='hidden']").each((_i, el) => {
        const name = $(el).attr("name");
        const value = $(el).attr("value") || "";
        if (name) {
          hiddenFields[name] = value;
        }
      });

      // Preparar los datos del formulario
      const formData: Record<string, string> = {
        ...hiddenFields,
        // Datos del cliente (todo en mayúsculas)
        nameconsignee: data.cname.toUpperCase(),
        cname: data.cname.toUpperCase(),
        cidentity: data.cidentity.toUpperCase(),
        // Datos adicionales
        ...(data.cphone ? { phoneconsignee: data.cphone.toUpperCase(), cphone: data.cphone.toUpperCase() } : {}),
        ...(data.caddress ? { addressconsignee: data.caddress.toUpperCase() } : {}),
        ...(data.ccity ? { cityconsignee: data.ccity.toUpperCase() } : {}),
        ...(data.cprovince ? { provinceconsignee: data.cprovince.toUpperCase() } : {}),
        ...(data.weight ? { weight: data.weight } : {}),
        ...(data.npieces ? { npieces: data.npieces } : {}),
        ...(data.description ? { description: data.description.toUpperCase() } : {}),
        ...(data.cnotes ? { cnotes: data.cnotes.toUpperCase() } : {}),
        // Datos de la empresa
        identerprise: session.identerprise,
      };

      // Intentar con saveReserve primero (es el más completo)
      const result = await saveReserve(session, formData);

      // Buscar si se generó un CPK en la respuesta
      const cpkMatch = result.match(/CPK-\d+/);
      if (cpkMatch) {
        return {
          success: true,
          cpk: cpkMatch[0],
          message: `Envío creado exitosamente: ${cpkMatch[0]}`,
          rawResponse: result,
        };
      }

      // Si no encontramos CPK, buscar por el nombre del consignatario
      const searchResults = await searchShipments(
        session,
        `(cname LIKE "%${data.cname.toUpperCase()}%") AND (r.identerprise = ${session.identerprise})`
      );

      if (searchResults.length > 0) {
        const latest = searchResults[searchResults.length - 1];
        return {
          success: true,
          cpk: latest.hbl || latest.idreserve || "PENDIENTE",
          message: `Envío creado: ${latest.hbl || latest.idreserve}`,
          rawResponse: result,
        };
      }

      // Si todo falla, devolver la respuesta raw
      return {
        success: true,
        message: "Envío registrado. Verifica en el sistema para obtener el número CPK.",
        rawResponse: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido al crear el envío",
      };
    }
  });
}
