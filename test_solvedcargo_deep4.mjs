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

async function main() {
  const loginResp = await apiCall("loginUser", { user: AUTH.user, password: AUTH.password });
  const cookie = `PHPSESSID=${loginResp.phpsessid}`;
  console.log("Login OK, session:", loginResp.phpsessid.substring(0, 16) + "...");
  console.log();

  // Try more functions that might be needed for initialization
  console.log("=== PROBE MORE FUNCTIONS ===");
  const probeFns = [
    { fn: "getMenu", params: {} },
    { fn: "getMenuItems", params: {} },
    { fn: "getModules", params: {} },
    { fn: "getTables", params: {} },
    { fn: "getPermissions", params: {} },
    { fn: "initSession", params: {} },
    { fn: "getConf", params: {} },
    { fn: "getConfig", params: {} },
    { fn: "getEnterpriseData", params: { identerprise: "55" } },
    { fn: "getUserPermissions", params: {} },
    { fn: "getListRecord", params: { option: "clasification", kind: "list", idrecord: "-1", where: "", orderby: "", offset: "-1", onlytable: "1" } },
    { fn: "getListRecord", params: { option: "typecorrespond", kind: "list", idrecord: "-1", where: "", orderby: "", offset: "-1", onlytable: "1" } },
    { fn: "getListRecord", params: { option: "province", kind: "list", idrecord: "-1", where: "", orderby: "", offset: "-1", onlytable: "1" } },
    { fn: "getListRecord", params: { option: "userxenterprise", kind: "list", idrecord: "-1", where: `identerprise=55`, orderby: "", offset: "-1", onlytable: "1" } },
  ];
  
  for (const p of probeFns) {
    try {
      const resp = await apiCall(p.fn, p.params, cookie);
      const bodyStr = typeof resp.body === "string" ? resp.body : JSON.stringify(resp.body);
      const rows = (bodyStr.match(/id_tr_\d+/g) || []).length;
      if (rows > 0 || (bodyStr.length > 50 && !bodyStr.includes("not found") && !bodyStr.includes("Function not found"))) {
        console.log(`\n  ${p.fn}: ${bodyStr.substring(0, 400)}`);
        if (rows > 0) console.log(`  >>> ${rows} ROWS FOUND!`);
      }
    } catch(e) {
      // skip
    }
  }
  console.log();

  // KEY TEST: Try getListRecord with kind=list but check if offset/limit matters
  console.log("=== TRY DIFFERENT OFFSETS ===");
  for (const offset of ["0", "10", "100", "-1", ""]) {
    const resp = await apiCall("getListRecord", {
      option: "reservef", kind: "list", idrecord: "-1",
      where: "identerprise=55", orderby: "idreserve DESC", offset, onlytable: "1",
    }, cookie);
    const html = typeof resp.body === "string" ? resp.body : JSON.stringify(resp.body);
    const rows = (html.match(/id_tr_\d+/g) || []).length;
    console.log(`  offset='${offset}': ${rows} rows`);
  }
  console.log();

  // KEY TEST: Try insert with updateRecord format instead
  console.log("=== TRY updateRecord FOR ACTUAL INSERT ===");
  // The updateRecord function generates SQL: "UPDATE table SET col=val WHERE id=x"
  // Let's see if we can use it differently
  const updResp = await apiCall("updateRecord", {
    option: "shipper",
    idrecord: "48590",
    params: "name='TEST UPDATE VIA API';address='123 UPDATED ST'",
  }, cookie);
  console.log("updateRecord:", updResp.body);
  console.log();

  // Check: Does the SolvedCargo web page load differently?
  console.log("=== FETCH MAIN PAGE HTML ===");
  const pageResp = await fetch(BASE_URL, {
    headers: { "Cookie": cookie },
    redirect: "manual",
  });
  const pageHtml = await pageResp.text();
  console.log("Main page status:", pageResp.status);
  console.log("Main page length:", pageHtml.length);
  // Look for JavaScript that makes API calls
  const apiCalls = pageHtml.match(/funcname[^"']*/g);
  if (apiCalls) {
    console.log("API functions mentioned in page:", [...new Set(apiCalls)].slice(0, 20));
  }
  // Look for routing.php or AJAX calls
  const ajaxMatches = pageHtml.match(/(routing\.php|ajax|fetch|XMLHttpRequest)[^;]{0,100}/gi);
  if (ajaxMatches) {
    console.log("AJAX patterns:", [...new Set(ajaxMatches)].slice(0, 10));
  }
  console.log();

  // FINAL KEY TEST: getNewRow full HTML to understand input structure
  console.log("=== getNewRow reservef FULL (first 4000 chars) ===");
  const rnr = await apiCall("getNewRow", { option: "reservef" }, cookie);
  console.log(typeof rnr.body === "string" ? rnr.body.substring(0, 4000) : JSON.stringify(rnr.body).substring(0, 4000));

  console.log("\n=== DONE ===");
}

main().catch(console.error);
