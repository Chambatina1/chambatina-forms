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
  console.log("Login OK, enterprise:", loginResp.body.identerprise);
  console.log();

  // SEARCH WITH DIFFERENT WHERE CLAUSES
  console.log("=== SEARCH: reservef ===");
  const searches = [
    { where: "" },
    { where: "identerprise=55" },
    { where: "1=1" },
    { where: "idreserve > 0" },
    { where: "idreserve=302148" },
    { where: "hbl LIKE '%CPK%'" },
    { where: "iduser=101" },
  ];
  
  for (const s of searches) {
    const resp = await apiCall("getListRecord", {
      option: "reservef", kind: "list", idrecord: "-1",
      where: s.where, orderby: "idreserve DESC", offset: "-1", onlytable: "1",
    }, cookie);
    const html = typeof resp.body === "string" ? resp.body : JSON.stringify(resp.body);
    const rows = countRows(html);
    const totalMatch = html.match(/title="(\d+)"/);
    console.log(`  WHERE='${s.where}' => ${rows} rows (title_total: ${totalMatch ? totalMatch[1] : '?'})`);
  }
  console.log();

  // Try "reserve" instead of "reservef"
  console.log("=== SEARCH: reserve (not reservef) ===");
  for (const w of ["", "identerprise=55", "1=1"]) {
    const resp = await apiCall("getListRecord", {
      option: "reserve", kind: "list", idrecord: "-1",
      where: w, orderby: "idreserve DESC", offset: "-1", onlytable: "1",
    }, cookie);
    const html = typeof resp.body === "string" ? resp.body : JSON.stringify(resp.body);
    console.log(`  WHERE='${w}' => ${countRows(html)} rows`);
  }
  console.log();

  // SEARCH shipper
  console.log("=== SEARCH: shipper ===");
  for (const w of ["", "1=1", "idshipper=48590", "idshipper=48573", "name LIKE '%CHAMBATINA%'", "name LIKE '%TEST%'"]) {
    const resp = await apiCall("getListRecord", {
      option: "shipper", kind: "list", idrecord: "-1",
      where: w, orderby: "idshipper DESC", offset: "-1", onlytable: "1",
    }, cookie);
    const html = typeof resp.body === "string" ? resp.body : JSON.stringify(resp.body);
    const rows = countRows(html);
    if (rows > 0) console.log(`  WHERE='${w}' => ${rows} rows <<< FOUND!`);
    else console.log(`  WHERE='${w}' => 0 rows`);
  }
  console.log();

  // Try kind=record for specific IDs
  console.log("=== kind=record for shipper 48590 ===");
  const recResp = await apiCall("getListRecord", {
    option: "shipper", kind: "record", idrecord: "48590",
    where: "", orderby: "", offset: "-1", onlytable: "1",
  }, cookie);
  const recHtml = typeof recResp.body === "string" ? recResp.body : JSON.stringify(recResp.body);
  console.log("Length:", recHtml.length, "Preview:", recHtml.substring(0, 300));
  console.log();

  // Full getNewRow HTML for reservef
  console.log("=== getNewRow reservef FULL ===");
  const nrResp = await apiCall("getNewRow", { option: "reservef" }, cookie);
  const nrHtml = typeof nrResp.body === "string" ? nrResp.body : JSON.stringify(nrResp.body);
  console.log(nrHtml.substring(0, 3000));
  console.log("...(truncated)");
  console.log();

  // getNewRow for shipper - full
  console.log("=== getNewRow shipper FULL ===");
  const snrResp = await apiCall("getNewRow", { option: "shipper" }, cookie);
  const snrHtml = typeof snrResp.body === "string" ? snrResp.body : JSON.stringify(snrResp.body);
  console.log(snrHtml);
  console.log();

  // Try insertRecord and immediately verify with kind=record
  console.log("=== INSERT + VERIFY with kind=record ===");
  const s1 = await apiCall("insertRecord", {
    option: "shipper",
    params: `;PROBE2 TEST;123 ST;;3050000001;;USA;p2@test.com;55`,
  }, cookie);
  console.log("Insert shipper:", s1.body);
  
  const s1Id = String(s1.body).trim();
  const verify1 = await apiCall("getListRecord", {
    option: "shipper", kind: "record", idrecord: s1Id,
    where: "", orderby: "", offset: "-1", onlytable: "1",
  }, cookie);
  const v1Html = typeof verify1.body === "string" ? verify1.body : JSON.stringify(verify1.body);
  console.log(`Verify kind=record id=${s1Id}: ${v1Html.length} chars`);
  console.log(v1Html.substring(0, 500));
  console.log();

  // Now try updateRecord
  console.log("=== updateRecord test ===");
  const updResp = await apiCall("updateRecord", {
    option: "shipper",
    idrecord: s1Id,
    params: `name='UPDATED PROBE2';address='456 AVE'`,
  }, cookie);
  console.log("updateRecord response:", updResp.body);
  console.log();

  // Check if getRecord works
  console.log("=== getRecord test ===");
  const getResp = await apiCall("getRecord", {
    option: "shipper",
    idrecord: s1Id,
  }, cookie);
  console.log("getRecord response:", typeof getResp.body === "string" ? getResp.body.substring(0, 500) : JSON.stringify(getResp.body));
  
  console.log("\n=== DONE ===");
}

main().catch(console.error);
