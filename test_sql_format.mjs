const API_S = "https://www.solvedc.com/cargopack/v1/php/solved/routing.php";
const API = "https://www.solvedc.com/cargo/cargopack/v1/php/routing.php";

async function main() {
  // Login
  const loginResp = await fetch(API_S, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ funcname: "loginUser", user: "GEO MIA", password: "GEO**091223" }).toString(),
    redirect: "manual",
  });
  const phpsessid = loginResp.headers.get("set-cookie")?.match(/PHPSESSID=([^;]+)/)?.[1] || "";
  const cookie = `PHPSESSID=${phpsessid}`;
  const h = { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookie };

  // Test insertRecord with values that will cause a visible error to see the full SQL
  // Use SOLVED endpoint
  console.log("1. Testing SOLVED endpoint (php/solved/routing.php):");
  const r1 = await fetch(API_S, {
    method: "POST", headers: h,
    body: new URLSearchParams({
      funcname: "insertRecord",
      option: "reservef",
      params: "BADSQLTEST123"
    }).toString()
  });
  console.log("  Result:", (await r1.text()).substring(0, 500));

  // Use MAIN endpoint  
  console.log("\n2. Testing MAIN endpoint (php/routing.php):");
  const r2 = await fetch(API, {
    method: "POST", headers: h,
    body: new URLSearchParams({
      funcname: "insertRecord",
      option: "reservef",
      params: "BADSQLTEST456"
    }).toString()
  });
  console.log("  Result:", (await r2.text()).substring(0, 500));

  // Now test with proper params format on MAIN endpoint
  console.log("\n3. Testing MAIN endpoint with proper reserve params:");
  const params3 = [
    "", "55", "101", "", "", "3", "44", "MAIN_ENDPOINT_TEST", "", "2026-05-02",
    "", "", "", "0", "0", "0", "1", "5", "0", "0", "4", "", "", "", "2026-05-02"
  ].join(";");
  const r3 = await fetch(API, {
    method: "POST", headers: h,
    body: new URLSearchParams({ funcname: "insertRecord", option: "reservef", params: params3 }).toString()
  });
  const result3 = (await r3.text()).trim();
  console.log("  Result:", result3.substring(0, 500));
  
  // Same with SOLVED endpoint
  console.log("\n4. Testing SOLVED endpoint with same params:");
  const r4 = await fetch(API_S, {
    method: "POST", headers: h,
    body: new URLSearchParams({ funcname: "insertRecord", option: "reservef", params: params3 }).toString()
  });
  const result4 = (await r4.text()).trim();
  console.log("  Result:", result4.substring(0, 500));
  
  // Search for record if either succeeded
  if (!isNaN(parseInt(result3)) || !isNaN(parseInt(result4))) {
    const searchId = !isNaN(parseInt(result3)) ? result3 : result4;
    console.log("\n5. Searching for record " + searchId + "...");
    const r5 = await fetch(API_S, {
      method: "POST", headers: h,
      body: new URLSearchParams({
        funcname: "getRecord", option: "reservef", kind: "list", idrecord: "-1",
        where: "idreserve=" + searchId, identerprise: "55,0"
      }).toString()
    });
    const html5 = await r5.text();
    console.log("  Found:", html5.includes(searchId) || html5.includes("MAIN_ENDPOINT_TEST"));
    console.log("  Rows:", (html5.match(/_trtitle_/g) || []).length);
  }
}
main().catch(console.error);
