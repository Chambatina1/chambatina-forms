// FINAL FIXED TEST with correct 47-column mapping
const API = "https://www.solvedc.com/cargo/cargopack/v1/php/solved/routing.php";
const API_LOGIN = "https://www.solvedc.com/cargo/cargopack/v1/php/solved/routing.php";
const API2 = "https://www.solvedc.com/cargo/cargopack/v1/php/routing.php";

async function call(url, params) {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  return await resp.text();
}

async function login() {
  const resp = await fetch(API_LOGIN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ funcname: "loginUser", user: "GEO MIA", password: "GEO**091223" }).toString(),
    redirect: "manual",
  });
  const setCookie = resp.headers.get("set-cookie") || "";
  const phpsessid = setCookie.match(/PHPSESSID=([^;]+)/)?.[1] || "";
  const text = await resp.text();
  const data = JSON.parse(text);
  return { iduser: data.iduser, identerprise: data.identerprise, phpsessid };
}

async function apiCall(funcname, params, session) {
  const resp = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `PHPSESSID=${session.phpsessid}`,
    },
    body: new URLSearchParams({ funcname, ...params }).toString(),
  });
  return (await resp.text()).trim();
}

async function apiCall2(funcname, params, session) {
  const resp = await fetch(API2, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `PHPSESSID=${session.phpsessid}`,
    },
    body: new URLSearchParams({ funcname, ...params }).toString(),
  });
  const text = await resp.text();
  try { return JSON.parse(text); } catch { return text; }
}

async function main() {
  console.log("=== FINAL FIX TEST (correct 47-column mapping) ===\n");
  
  // Login
  const session = await login();
  console.log("1. Login OK");

  // Get defaults
  const defaults = await apiCall2("getDefaultValues", { identerprise: "55" }, session);
  const guideId = defaults.reservef.guide;
  console.log("2. Default guide for reservef:", guideId);

  // Insert shipper
  const shipperId = await apiCall("insertRecord", {
    option: "shipper",
    params: ";FINAL FIX SHIPPER;999 FINAL ST;;3051119999;;USA;ftest@test.com;55"
  }, session);
  console.log("3. Shipper ID:", shipperId);

  // Insert consignee
  const consigneeId = await apiCall("insertRecord", {
    option: "consignee",
    params: `;FINAL;TEST;CONSIGNEE;;99988877;;3051118888;CALLE FINAL #999;;;;55`
  }, session);
  console.log("4. Consignee ID:", consigneeId);

  // Insert reserve with CORRECT 47-column mapping
  const today = new Date().toISOString().split("T")[0];
  const reserveParams = [
    "",              // [0] idreserve (auto)
    "55",            // [1] identerprise
    "101",           // [2] iduser
    "",              // [3] image ← WAS MISSING!
    "",              // [4] hbl (empty - setHblNumber will set it)
    "",              // [5] idreservestate ← WAS MISSING!
    "0",             // [6] shipped ← WAS MISSING!
    "",              // [7] idloadingguide ← WAS MISSING!
    "",              // [8] idfbcnumber
    guideId,         // [9] idfbcguide = "3" ← THE KEY FIX (was in wrong position!)
    "44",            // [10] idclasification (ENVIO)
    "MERCANCIA FINAL FIX", // [11] namegood
    "",              // [12] bagnumber
    today,           // [13] datereserve
    "",              // [14] namepurchaser (display)
    "",              // [15] namepurchaser (data)
    "",              // [16] namepurchaser (data)
    consigneeId,     // [17] nameconsignee → idconsignee (FK)
    consigneeId,     // [18] nameconsignee (data)
    consigneeId,     // [19] nameconsignee (data)
    "",              // [20] passport (consignee)
    "",              // [21] cidentity
    "CALLE FINAL #999", // [22] street (consignee)
    "3051118888",    // [23] ctelephone
    shipperId,       // [24] nameshipper → idshipper (FK)
    shipperId,       // [25] nameshipper (data)
    shipperId,       // [26] nameshipper (data)
    "",              // [27] spassport (shipper)
    "999 FINAL ST",  // [28] address (shipper)
    "0",             // [29] multhouse
    "",              // [30] pidentity
    "",              // [31] ppassport
    "",              // [32] ptelephone
    "0",             // [33] valuebill
    "0",             // [34] valuedoc
    "1",             // [35] quantity
    "5",             // [36] weight
    "0",             // [37] volume
    "0",             // [38] value
    "4",             // [39] idtypecorrespond (FBC/CPK)
    "",              // [40] idguidekind
    "",              // [41] idguidestate
    "0",             // [42] valuedanger ← WAS MISSING!
    "0",             // [43] valuepaied ← WAS MISSING!
    "CREADO CON COLUMNAS CORREGIDAS", // [44] observation
    "",              // [45] whnumber
    today,           // [46] entrydate
  ].join(";");
  
  console.log("5. Inserting reserve with 47 fields, idfbcguide=" + guideId + "...");
  const reserveId = await apiCall("insertRecord", { option: "reservef", params: reserveParams }, session);
  console.log("   Reserve ID:", reserveId);

  // Call setHblNumber to assign CPK
  console.log("6. Calling setHblNumber...");
  const hblResult = await apiCall2("setHblNumber", { kind: "reservef", idguide: guideId }, session);
  console.log("   setHblNumber result:", hblResult);

  // Search for the record
  console.log("7. Searching for record...");
  const searchHtml = await apiCall("getRecord", {
    option: "reservef",
    kind: "list",
    idrecord: "-1",
    where: `(fg.idfbcguide = ${guideId}) AND (r.identerprise = 55)`,
    identerprise: "55,0",
  }, session);
  
  // Check for our data
  const hasOurData = searchHtml.includes("FINAL FIX") || searchHtml.includes("CREADO CON COLUMNAS CORREGIDAS");
  const cpkMatches = searchHtml.match(/CPK-\d+/g) || [];
  const trTitleCount = (searchHtml.match(/_trtitle_/g) || []).length;
  
  console.log("   Response length:", searchHtml.length);
  console.log("   Data rows (_trtitle_):", trTitleCount);
  console.log("   CPKs found:", [...new Set(cpkMatches)]);
  console.log("   Our data found:", hasOurData ? "YES!!!" : "NO");
  
  // Get the latest CPK number
  const hblNumber = await apiCall2("getHblNumber", { getcode: "1", kind: "reservef", idguide: guideId }, session);
  console.log("\n   Latest HBL:", JSON.stringify(hblNumber));
  
  console.log("\n=== TEST COMPLETE ===");
}

main().catch(console.error);
