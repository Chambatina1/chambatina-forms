const API = "https://www.solvedc.com/cargo/cargopack/v1/php/solved/routing.php";

async function insert(cookie, option, params) {
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookie },
    body: new URLSearchParams({ funcname: "insertRecord", option, params }).toString(),
  });
  return (await r.text()).trim();
}

async function search(cookie, idreserve) {
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookie },
    body: new URLSearchParams({ funcname: "getRecord", option: "reservef", kind: "list", idrecord: "-1", where: "idreserve=" + idreserve, identerprise: "55,0" }).toString(),
  });
  return (await r.text()).includes('"' + idreserve + '"');
}

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
  console.log("Login OK");

  // Test 1: Minimal reserve (just required fields)
  const t1 = await insert(cookie, "reservef", ";;55;101;;;;44;TEST1;;;;;;;;0;0;0;0;0;0;4;;;");
  console.log("Test1 (minimal):", t1, "→ exists:", await search(cookie, t1));

  // Test 2: With idfbcguide=3
  const t2 = await insert(cookie, "reservef", ";;55;101;;;;3;44;TEST2;;;;;;;;0;0;0;0;0;0;4;;;");
  console.log("Test2 (guide=3):", t2, "→ exists:", await search(cookie, t2));

  // Test 3: Full 25 params with guide=3
  const t3 = await insert(cookie, "reservef", [
    "", "55", "101", "", "", "3", "44", "TEST3", "", "2026-05-02",
    "", "", "", "0", "0", "0", "1", "5", "0", "0", "4", "", "", "", "2026-05-02"
  ].join(";"));
  console.log("Test3 (full25):", t3, "→ exists:", await search(cookie, t3));

  // Test 4: With consignee and shipper IDs
  const sId = await insert(cookie, "shipper", ";TEST4 SHIP;ADDR;;3050000001;;USA;t4@t.com;55");
  const cId = await insert(cookie, "consignee", ";TEST4;CONS;;123;;3050000002;ADDR;;;;55");
  console.log("Shipper:", sId, "Consignee:", cId);
  
  const t4 = await insert(cookie, "reservef", [
    "", "55", "101", "", "", "3", "44", "TEST4 GOODS", "", "2026-05-02",
    "", cId, sId, "0", "0", "0", "1", "5", "0", "0", "4", "", "TEST4 OBS", "", "2026-05-02"
  ].join(";"));
  console.log("Test4 (with IDs):", t4, "→ exists:", await search(cookie, t4));
}

main().catch(console.error);
