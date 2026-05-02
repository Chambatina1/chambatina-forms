// Use CORRECT endpoint: php/routing.php for insertRecord!
const API_SOLVE = "https://www.solvedc.com/cargo/cargopack/v1/php/solved/routing.php";
const API_MAIN = "https://www.solvedc.com/cargo/cargopack/v1/php/routing.php";

async function main() {
  // Login via php/solved/routing.php
  const loginResp = await fetch(API_SOLVE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ funcname: "loginUser", user: "GEO MIA", password: "GEO**091223" }).toString(),
    redirect: "manual",
  });
  const phpsessid = loginResp.headers.get("set-cookie")?.match(/PHPSESSID=([^;]+)/)?.[1] || "";
  const cookie = `PHPSESSID=${phpsessid}`;
  const h = { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookie };
  console.log("1. Login OK, session:", phpsessid.substring(0, 12) + "...");
  const today = "2026-05-02";

  // insertRecord goes to php/routing.php (NOT php/solved/routing.php)!
  // Insert shipper
  let r = await fetch(API_MAIN, { method: "POST", headers: h, body: new URLSearchParams({ funcname: "insertRecord", option: "shipper", params: ";CORRECT ENDPOINT SHIP;888 ST;;3058888888;;USA;ce@test.com;55" }).toString() });
  const shipperId = (await r.text()).trim();
  console.log("2. Shipper (via routing.php):", shipperId);

  // Insert consignee
  r = await fetch(API_MAIN, { method: "POST", headers: h, body: new URLSearchParams({ funcname: "insertRecord", option: "consignee", params: ";CORRECT;ENDPOINT;CONSIGNEE;;99988888;;3058889999;CALLE 888;;;;55" }).toString() });
  const consigneeId = (await r.text()).trim();
  console.log("3. Consignee (via routing.php):", consigneeId);

  // Insert reserve with idfbcguide=3
  const reserveParams = [
    "",           // [0] idreserve
    "55",         // [1] identerprise
    "101",        // [2] iduser
    "",           // [3] hbl
    "",           // [4] idfbcnumber
    "3",          // [5] idfbcguide = 3 ← FIX
    "44",         // [6] idclasification
    "CORRECT ENDPOINT GOODS", // [7] goods
    "",           // [8] bagnumber
    today,        // [9] datereserve
    "",           // [10] idpurchaser
    consigneeId,  // [11] idconsignee
    shipperId,    // [12] idshipper
    "0",          // [13] multhouse
    "0",          // [14] valuebill
    "0",          // [15] valuedoc
    "1",          // [16] quantity
    "5",          // [17] weight
    "0",          // [18] volume
    "0",          // [19] value
    "4",          // [20] idtypecorrespond
    "",           // [21] idguidekind
    "CORRECT ENDPOINT OBS", // [22] observation
    "",           // [23] whnumber
    today,        // [24] entrydate
  ].join(";");
  
  console.log("4. Inserting reserve (via routing.php, idfbcguide=3)...");
  r = await fetch(API_MAIN, { method: "POST", headers: h, body: new URLSearchParams({ funcname: "insertRecord", option: "reservef", params: reserveParams }).toString() });
  const reserveResult = (await r.text()).trim();
  console.log("   Reserve result:", reserveResult);

  // Call setHblNumber
  r = await fetch(API_MAIN, { method: "POST", headers: h, body: new URLSearchParams({ funcname: "setHblNumber", kind: "reservef", idguide: "3" }).toString() });
  const hblResult = (await r.text()).trim();
  console.log("5. setHblNumber:", hblResult);

  // Search via php/solved/routing.php (correct endpoint for getRecord)
  r = await fetch(API_SOLVE, { method: "POST", headers: h, body: new URLSearchParams({ funcname: "getRecord", option: "reservef", kind: "list", idrecord: "-1", where: "(fg.idfbcguide = 3) AND (r.identerprise = 55)", identerprise: "55,0" }).toString() });
  const html = await r.text();
  const hasOurData = html.includes("CORRECT ENDPOINT");
  const cpks = [...new Set(html.match(/CPK-\d+/g) || [])];
  const trTitles = (html.match(/_trtitle_/g) || []).length;
  console.log(`6. Search: ${trTitles} rows, CPKs: ${cpks.length}, Our data: ${hasOurData ? "YES!!!" : "NO"}`);
  if (cpks.length > 0) console.log("   CPKs:", cpks.slice(0, 15));
}

main().catch(console.error);
