const BASE_URL = "https://www.solvedc.com/cargo/cargopack/v1";
const API_PATH = `${BASE_URL}/php/solved/routing.php`;
const AUTH = { user: "GEO MIA", password: "GEO**091223" };

async function apiCall(funcname, extraParams = {}, cookie = "") {
  const params = new URLSearchParams({ funcname, ...extraParams });
  const headers = { "Content-Type": "application/x-www-form-urlencoded" };
  if (cookie) headers["Cookie"] = cookie;
  const resp = await fetch(API_PATH, { method: "POST", headers, body: params.toString(), redirect: "manual" });
  const setCookie = resp.headers.get("set-cookie") || "";
  const phpsessid = setCookie.match(/PHPSESSID=([^;]+)/)?.[1] || "";
  const text = await resp.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: resp.status, phpsessid, body };
}

function countRows(html) {
  return (html.match(/id_tr_\d+/g) || []).length;
}

async function main() {
  const loginResp = await apiCall("loginUser", { user: AUTH.user, password: AUTH.password });
  const cookie = `PHPSESSID=${loginResp.phpsessid}`;
  console.log("Login OK");
  console.log();

  // Check title attribute in table for total rows
  console.log("=== CHECK title attribute (total rows) ===");
  const r1 = await apiCall("getListRecord", {
    option: "reservef", kind: "list", idrecord: "-1",
    where: "identerprise=55", orderby: "idreserve DESC", offset: "-1", onlytable: "1",
  }, cookie);
  const r1Html = typeof r1.body === "string" ? r1.body : JSON.stringify(r1.body);
  const titleMatch = r1Html.match(/id="id_tbl_reservef"[^>]*title="([^"]*)"/);
  console.log("Table title attr:", titleMatch ? titleMatch[1] : "not found");
  // Check if styletbl has total
  const styleMatch = r1Html.match(/_totalrows_/g);
  console.log("_totalrows_ placeholder found:", styleMatch ? "yes (unreplaced)" : "no");
  console.log();

  // Try with onlytable=0
  console.log("=== TRY onlytable=0 (full page) ===");
  const r2 = await apiCall("getListRecord", {
    option: "reservef", kind: "list", idrecord: "-1",
    where: "identerprise=55", orderby: "idreserve DESC", offset: "-1",
    onlytable: "0",
  }, cookie);
  const r2Html = typeof r2.body === "string" ? r2.body : JSON.stringify(r2.body);
  console.log("Length:", r2Html.length);
  console.log("Preview:", r2Html.substring(0, 500));
  console.log();

  // Try without onlytable param
  console.log("=== TRY without onlytable ===");
  const r3 = await apiCall("getListRecord", {
    option: "reservef", kind: "list", idrecord: "-1",
    where: "identerprise=55", orderby: "idreserve DESC", offset: "-1",
  }, cookie);
  const r3Html = typeof r3.body === "string" ? r3.body : JSON.stringify(r3.body);
  console.log("Length:", r3Html.length);
  console.log("Preview:", r3Html.substring(0, 800));
  console.log();

  // Try different kind values
  console.log("=== TRY different 'kind' values ===");
  for (const kind of ["list", "List", "LIST", "grid", "data", "json", "all", "count"]) {
    const resp = await apiCall("getListRecord", {
      option: "reservef", kind, idrecord: "-1",
      where: "identerprise=55", orderby: "idreserve DESC", offset: "-1", onlytable: "1",
    }, cookie);
    const html = typeof resp.body === "string" ? resp.body : JSON.stringify(resp.body);
    console.log(`  kind='${kind}': ${html.length} chars, ${countRows(html)} rows, preview: ${html.substring(0, 80)}`);
  }
  console.log();

  // Check getNewRow shipper - look for identerprise column position
  console.log("=== getNewRow shipper - analyze columns ===");
  const snr = await apiCall("getNewRow", { option: "shipper" }, cookie);
  const snrHtml = typeof snr.body === "string" ? snr.body : JSON.stringify(snr.body);
  // Extract all th ids and labels
  const thMatches = snrHtml.match(/id="id_th_([^"]*)"[^>]*>([^<]*)/g);
  if (thMatches) {
    console.log("Shipper columns:");
    thMatches.forEach((m, i) => {
      const idMatch = m.match(/id="id_th_([^"]*)"/);
      const labelMatch = m.match(/>([^<]*)/);
      console.log(`  [${i}] ${idMatch?.[1]} = ${labelMatch?.[1]?.trim()}`);
    });
  }
  // Extract input ids to understand column indices
  const inputMatches = snrHtml.match(/id="id_shipper_([^"]*)"/g);
  if (inputMatches) {
    console.log("\nShipper inputs:");
    inputMatches.forEach(m => console.log(`  ${m}`));
  }
  console.log();

  // Same for consignee
  console.log("=== getNewRow consignee - analyze columns ===");
  const cnr = await apiCall("getNewRow", { option: "consignee" }, cookie);
  const cnrHtml = typeof cnr.body === "string" ? cnr.body : JSON.stringify(cnr.body);
  const cthMatches = cnrHtml.match(/id="id_th_([^"]*)"[^>]*>([^<]*)/g);
  if (cthMatches) {
    console.log("Consignee columns:");
    cthMatches.forEach((m, i) => {
      const idMatch = m.match(/id="id_th_([^"]*)"/);
      const labelMatch = m.match(/>([^<]*)/);
      console.log(`  [${i}] ${idMatch?.[1]} = ${labelMatch?.[1]?.trim()}`);
    });
  }
  const cinputMatches = cnrHtml.match(/id="id_consignee_([^"]*)"/g);
  if (cinputMatches) {
    console.log("\nConsignee inputs (first 10):");
    cinputMatches.slice(0, 10).forEach(m => console.log(`  ${m}`));
  }
  console.log();

  // Same for reservef
  console.log("=== getNewRow reservef - analyze columns ===");
  const rnr = await apiCall("getNewRow", { option: "reservef" }, cookie);
  const rnrHtml = typeof rnr.body === "string" ? rnr.body : JSON.stringify(rnr.body);
  const rthMatches = rnrHtml.match(/id="id_th_([^"]*)"[^>]*>([^<]*)/g);
  if (rthMatches) {
    console.log("Reserve columns:");
    rthMatches.forEach((m, i) => {
      const idMatch = m.match(/id="id_th_([^"]*)"/);
      const labelMatch = m.match(/>([^<]*)/);
      console.log(`  [${i}] ${idMatch?.[1]} = ${labelMatch?.[1]?.trim()}`);
    });
  }
  const rinputMatches = rnrHtml.match(/id="id_reservef_([^"]*)"/g);
  if (rinputMatches) {
    console.log("\nReserve inputs (first 15):");
    rinputMatches.slice(0, 15).forEach(m => console.log(`  ${m}`));
  }
  // Also look for select/options to understand dropdowns
  const selectMatches = rnrHtml.match(/<select[^>]*id="id_reservef_([^"]*)"[^>]*>/g);
  if (selectMatches) {
    console.log("\nReserve selects:");
    selectMatches.forEach(m => console.log(`  ${m}`));
  }
  console.log();

  console.log("=== DONE ===");
}

main().catch(console.error);
