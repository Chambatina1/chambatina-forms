const API = "https://www.solvedc.com/cargo/cargopack/v1/php/solved/routing.php";
const API2 = "https://www.solvedc.com/cargo/cargopack/v1/php/routing.php";

async function main() {
  // Login
  const loginResp = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ funcname: "loginUser", user: "GEO MIA", password: "GEO**091223" }).toString(),
    redirect: "manual",
  });
  const phpsessid = loginResp.headers.get("set-cookie")?.match(/PHPSESSID=([^;]+)/)?.[1] || "";
  const cookie = `PHPSESSID=${phpsessid}`;
  console.log("1. Login OK");
  
  const headers = { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookie };
  const today = "2026-05-02";
  
  // Insert shipper
  let r = await fetch(API, { method: "POST", headers, body: new URLSearchParams({ funcname: "insertRecord", option: "shipper", params: ";SIMPLE FIX SHIP;777 ST;;3057777777;;USA;sf@t.com;55" }).toString() });
  const shipperId = (await r.text()).trim();
  console.log("2. Shipper:", shipperId);
  
  // Insert consignee
  r = await fetch(API, { method: "POST", headers, body: new URLSearchParams({ funcname: "insertRecord", option: "consignee", params: ";SIMPLE;TEST;CONSIGNEE;;99988877;;3057778888;CALLE 777;;;;55" }).toString() });
  const consigneeId = (await r.text()).trim();
  console.log("3. Consignee:", consigneeId);
  
  // KEY FIX: Reserve with idfbcguide="3" at position [5] (25 params, matching 25 DB columns)
  const reserveParams = [
    "",           // [0] idreserve
    "55",         // [1] identerprise
    "101",        // [2] iduser
    "",           // [3] hbl
    "",           // [4] idfbcnumber
    "3",          // [5] idfbcguide = 3 ← THE FIX!
    "44",         // [6] idclasification
    "SIMPLE FIX GOODS", // [7] goods
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
    "SIMPLE FIX OBSERVATION", // [22] observation
    "",           // [23] whnumber
    today,        // [24] entrydate
  ].join(";");
  
  console.log("4. Inserting reserve (25 params, idfbcguide=3)...");
  r = await fetch(API, { method: "POST", headers, body: new URLSearchParams({ funcname: "insertRecord", option: "reservef", params: reserveParams }).toString() });
  const reserveResult = (await r.text()).trim();
  console.log("   Result:", reserveResult);
  
  // Call setHblNumber
  r = await fetch(API2, { method: "POST", headers, body: new URLSearchParams({ funcname: "setHblNumber", kind: "reservef", idguide: "3" }).toString() });
  console.log("5. setHblNumber:", (await r.text()).trim());
  
  // Search for our record
  r = await fetch(API, { method: "POST", headers, body: new URLSearchParams({ funcname: "getRecord", option: "reservef", kind: "list", idrecord: "-1", where: "(fg.idfbcguide = 3) AND (r.identerprise = 55)", identerprise: "55,0" }).toString() });
  const html = await r.text();
  const hasOurData = html.includes("SIMPLE FIX");
  const cpks = [...new Set(html.match(/CPK-\d+/g) || [])];
  const trTitles = (html.match(/_trtitle_/g) || []).length;
  console.log(`6. Search: ${trTitles} rows, CPKs: ${cpks.length}, Our data: ${hasOurData ? "YES!!!" : "NO"}`);
  if (cpks.length > 0) console.log("   CPKs:", cpks.slice(0, 5));
}

main().catch(console.error);
