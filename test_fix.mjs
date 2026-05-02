// FIXED SolvedCargo API test with correct parameters
const BASE_URL = "https://www.solvedc.com/cargo/cargopack/v1";
const API_PATH = `${BASE_URL}/php/solved/routing.php`;
const API_PATH2 = `${BASE_URL}/php/routing.php`;
const AUTH = { user: "GEO MIA", password: "GEO**091223" };

async function apiCall(funcname, extraParams = {}, cookie = "", basePath = API_PATH) {
  const params = new URLSearchParams({ funcname, ...extraParams });
  const headers = { "Content-Type": "application/x-www-form-urlencoded" };
  if (cookie) headers["Cookie"] = cookie;
  const resp = await fetch(basePath, { method: "POST", headers, body: params.toString(), redirect: "manual" });
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
  console.log("=== FIXED SOLVEDCARGO API TEST ===\n");

  // 1. LOGIN
  const loginResp = await apiCall("loginUser", { user: AUTH.user, password: AUTH.password });
  const cookie = `PHPSESSID=${loginResp.phpsessid}`;
  console.log("1. Login OK, session:", loginResp.phpsessid.substring(0, 16) + "...");

  // 2. GET DEFAULT VALUES
  const defResp = await apiCall("getDefaultValues", { identerprise: "55" }, cookie, API_PATH2);
  const defaults = defResp.body;
  console.log("2. Default values:", JSON.stringify(defaults));
  const guideId = defaults.reservef.guide;
  console.log("   Guide ID for reservef:", guideId);

  // 3. GET HBL NUMBER
  const hblResp = await apiCall("getHblNumber", { getcode: "1", kind: "reservef", idguide: guideId }, cookie, API_PATH2);
  const hbl = hblResp.body;
  console.log("3. HBL:", JSON.stringify(hbl));
  const cpkNumber = hbl.hawb;
  console.log("   CPK Number:", cpkNumber);

  // 4. INSERT SHIPPER
  console.log("\n4. Inserting shipper...");
  const shipperParams = `;API TEST SHIPPER;123 API TEST ST;;3059991234;;USA;apitest@test.com;55`;
  const shipperResp = await apiCall("insertRecord", { option: "shipper", params: shipperParams }, cookie);
  const shipperId = String(shipperResp.body).trim();
  console.log("   Shipper ID:", shipperId);

  // 5. INSERT CONSIGNEE
  console.log("5. Inserting consignee...");
  const consigneeParams = `;API;TEST;CONSIGNEE;;12345678;;3059995678;CALLE TEST #123;;;;55`;
  const consigneeResp = await apiCall("insertRecord", { option: "consignee", params: consigneeParams }, cookie);
  const consigneeId = String(consigneeResp.body).trim();
  console.log("   Consignee ID:", consigneeId);

  // 6. INSERT RESERVE WITH idfbcguide AND hbl
  console.log("6. Inserting reserve with idfbcguide=" + guideId + ", hbl=" + cpkNumber + "...");
  const today = new Date().toISOString().split("T")[0];
  const reserveParams = [
    "",                    // [0] idreserve (auto)
    "55",                  // [1] identerprise
    "101",                 // [2] iduser
    cpkNumber,             // [3] hbl (CPK number from getHblNumber)
    "",                    // [4] idfbcnumber (leave empty?)
    guideId,               // [5] idfbcguide = 3 (THE FIX!)
    "44",                  // [6] idclasification (ENVIO)
    "TEST MERCANCIA API",  // [7] goods
    "",                    // [8] bagnumber
    today,                 // [9] datereserve
    "",                    // [10] idpurchaser
    consigneeId,           // [11] idconsignee
    shipperId,             // [12] idshipper
    "0",                   // [13] multhouse
    "0",                   // [14] valuebill
    "0",                   // [15] valuedoc
    "1",                   // [16] quantity
    "5",                   // [17] weight
    "0",                   // [18] volume
    "0",                   // [19] value
    "4",                   // [20] idtypecorrespond (FBC/CPK)
    "",                    // [21] idguidekind
    "CREADO VIA API FIX",  // [22] observation
    "",                    // [23] whnumber
    today,                 // [24] entrydate
  ].join(";");
  
  const reserveResp = await apiCall("insertRecord", { option: "reservef", params: reserveParams }, cookie);
  const reserveId = String(reserveResp.body).trim();
  console.log("   Reserve ID:", reserveId);

  // 7. SEARCH FOR THE RECORD using correct function and where clause
  console.log("\n7. Searching for the record...");
  
  // First try with getRecord (what the web UI uses)
  const searchResp = await apiCall("getRecord", {
    option: "reservef",
    kind: "list",
    idrecord: "-1",
    where: `(fg.idfbcguide = ${guideId}) AND (r.identerprise = 55)`,
    identerprise: "55,0",
  }, cookie);
  
  const searchHtml = typeof searchResp.body === "string" ? searchResp.body : JSON.stringify(searchResp.body);
  const rows = countRows(searchHtml);
  console.log("   getRecord rows found:", rows);
  
  // Check if our CPK appears in the results
  if (searchHtml.includes(cpkNumber)) {
    console.log("   >>> CPK " + cpkNumber + " FOUND IN RESULTS! <<<");
  } else {
    console.log("   CPK " + cpkNumber + " NOT found in results");
    console.log("   Search HTML (first 1000):", searchHtml.substring(0, 1000));
  }

  // Also try with getListRecord
  console.log("\n8. Also trying getListRecord...");
  const search2 = await apiCall("getListRecord", {
    option: "reservef",
    kind: "list",
    idrecord: "-1",
    where: `(fg.idfbcguide = ${guideId}) AND (r.identerprise = 55)`,
    identerprise: "55,0",
  }, cookie);
  const search2Html = typeof search2.body === "string" ? search2.body : JSON.stringify(search2.body);
  console.log("   getListRecord rows:", countRows(search2Html));
  if (search2Html.includes(cpkNumber)) {
    console.log("   >>> CPK FOUND via getListRecord! <<<");
  }

  console.log("\n=== TEST COMPLETE ===");
}

main().catch(console.error);
