// Deep investigation of SolvedCargo API
const BASE_URL = "https://www.solvedc.com/cargo/cargopack/v1";
const API_PATH = `${BASE_URL}/php/solved/routing.php`;
const AUTH = {
  user: "GEO MIA",
  password: "GEO**091223",
  identerprise: "55",
  iduser: "101",
};

async function apiCall(funcname, extraParams = {}, cookie = "") {
  const params = new URLSearchParams({ funcname, ...extraParams });
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (cookie) headers["Cookie"] = cookie;
  
  const resp = await fetch(API_PATH, {
    method: "POST",
    headers,
    body: params.toString(),
    redirect: "manual",
  });
  
  const setCookie = resp.headers.get("set-cookie") || "";
  const phpsessid = setCookie.match(/PHPSESSID=([^;]+)/)?.[1] || "";
  const contentType = resp.headers.get("content-type") || "";
  
  let body;
  if (contentType.includes("json")) {
    body = await resp.json();
  } else {
    body = await resp.text();
  }
  
  return { status: resp.status, phpsessid, body, contentType };
}

async function main() {
  console.log("=== SOLVEDCARGO DEEP INVESTIGATION ===\n");

  // 1. LOGIN
  console.log("--- 1. LOGIN ---");
  const loginResp = await apiCall("loginUser", {
    user: AUTH.user,
    password: AUTH.password,
  });
  console.log("Login status:", loginResp.status);
  console.log("PHPSESSID:", loginResp.phpsessid ? "OBTENIDA" : "NO");
  console.log("Login body:", JSON.stringify(loginResp.body).substring(0, 300));
  
  if (!loginResp.phpsessid) {
    console.log("FATAL: No session obtained");
    return;
  }
  
  const cookie = `PHPSESSID=${loginResp.phpsessid}`;
  const iduser = loginResp.body.iduser;
  const identerprise = loginResp.body.identerprise;
  console.log("iduser:", iduser, "identerprise:", identerprise);
  console.log();

  // 2. CHECK SESSION
  console.log("--- 2. CHECK SESSION ---");
  const sessionCheck = await apiCall("checkIfValidSession", {
    username: AUTH.user,
    password: AUTH.password,
  }, cookie);
  console.log("Session valid:", sessionCheck.body.trim());
  console.log();

  // 3. TRY getNewRow for different tables to understand schemas
  console.log("--- 3. EXPLORE TABLE SCHEMAS (getNewRow) ---");
  const tables = ["shipper", "consignee", "reservef", "reserve", "guide", "fbcnumber", "fbcguide"];
  for (const table of tables) {
    const resp = await apiCall("getNewRow", { option: table }, cookie);
    const bodyStr = typeof resp.body === "string" ? resp.body : JSON.stringify(resp.body);
    if (bodyStr.length > 20) {
      console.log(`\n  Table '${table}' (${bodyStr.length} chars):`);
      // Try to show column names
      const colMatch = bodyStr.match(/id="id_th_[^"]*"[^>]*>([^<]*)/g);
      if (colMatch) {
        const cols = colMatch.map(m => {
          const nameMatch = m.match(/id="id_th_([^"]*)"/);
          const labelMatch = m.match(/>([^<]*)/);
          return `${nameMatch?.[1]}="${labelMatch?.[1]?.trim()}"`;
        });
        console.log("  Columns:", cols.join(", "));
      } else {
        console.log("  Raw (first 500):", bodyStr.substring(0, 500));
      }
    } else {
      console.log(`  Table '${table}': ${bodyStr.substring(0, 100)}`);
    }
  }
  console.log();

  // 4. SEARCH FOR RECENTLY CREATED RECORDS
  console.log("--- 4. SEARCH FOR RECENT RESERVES ---");
  const searchResp = await apiCall("getListRecord", {
    option: "reservef",
    kind: "list",
    idrecord: "-1",
    where: `identerprise=${identerprise}`,
    orderby: "idreserve DESC",
    offset: "-1",
    onlytable: "1",
  }, cookie);
  
  const searchBody = typeof searchResp.body === "string" ? searchResp.body : JSON.stringify(searchResp.body);
  console.log("Search response length:", searchBody.length);
  
  // Count rows
  const rowMatches = searchBody.match(/id_tr_\d+/g);
  console.log("Number of reserve rows found:", rowMatches ? rowMatches.length : 0);
  
  // Try to extract HBL/CPK numbers from the HTML
  const hblMatches = searchBody.match(/CPK-\d+/g);
  console.log("CPK numbers found:", hblMatches ? [...new Set(hblMatches)] : "none");
  
  // Show first 2000 chars to understand structure
  console.log("\nRaw HTML (first 2000):");
  console.log(searchBody.substring(0, 2000));
  console.log();

  // 5. SEARCH FOR RECENT SHIPPERS
  console.log("--- 5. SEARCH FOR RECENT SHIPPERS ---");
  const shipperResp = await apiCall("getListRecord", {
    option: "shipper",
    kind: "list",
    idrecord: "-1",
    where: `identerprise=${identerprise}`,
    orderby: "idshipper DESC",
    offset: "-1",
    onlytable: "1",
  }, cookie);
  
  const shipperBody = typeof shipperResp.body === "string" ? shipperResp.body : JSON.stringify(shipperResp.body);
  const shipperRows = shipperBody.match(/id_tr_\d+/g);
  console.log("Number of shipper rows:", shipperRows ? shipperRows.length : 0);
  console.log("Shipper HTML (first 1500):");
  console.log(shipperBody.substring(0, 1500));
  console.log();

  // 6. SEARCH FOR RECENT CONSIGNEES
  console.log("--- 6. SEARCH FOR RECENT CONSIGNEES ---");
  const consigneeResp = await apiCall("getListRecord", {
    option: "consignee",
    kind: "list",
    idrecord: "-1",
    where: `identerprise=${identerprise}`,
    orderby: "idconsignee DESC",
    offset: "-1",
    onlytable: "1",
  }, cookie);
  
  const consigneeBody = typeof consigneeResp.body === "string" ? consigneeResp.body : JSON.stringify(consigneeResp.body);
  const consigneeRows = consigneeBody.match(/id_tr_\d+/g);
  console.log("Number of consignee rows:", consigneeRows ? consigneeRows.length : 0);
  console.log("Consignee HTML (first 1500):");
  console.log(consigneeBody.substring(0, 1500));
  console.log();

  // 7. TRY DIFFERENT FUNCTIONS - list what's available
  console.log("--- 7. PROBE OTHER FUNCTIONS ---");
  const probeFunctions = [
    "getRecord", "updateRecord", "saveRecord", "deleteRecord",
    "getEnterprise", "getUserData", "getClasifications",
    "getTypeCorrespond", "getProvinces", "getListEnterprise",
    "getCountRecord", "getFullRecord", "getRecordById",
  ];
  for (const fn of probeFunctions) {
    const resp = await apiCall(fn, {}, cookie);
    const bodyStr = typeof resp.body === "string" ? resp.body : JSON.stringify(resp.body);
    const truncated = bodyStr.substring(0, 200);
    if (bodyStr.length > 5 && !bodyStr.includes("Function not found") && !bodyStr.includes("not found")) {
      console.log(`  ${fn}: ${truncated}`);
    }
  }
  console.log();

  // 8. TRY insertRecord with just shipper and check
  console.log("--- 8. INSERT TEST SHIPPER AND VERIFY ---");
  const testShipperParams = `;TEST CHAMBATINA API PROBE;123 TEST ST MIAMI;;3055551234;;CUBA;test@probe.com;${identerprise}`;
  console.log("Inserting test shipper...");
  const insertResp = await apiCall("insertRecord", {
    option: "shipper",
    params: testShipperParams,
  }, cookie);
  console.log("Insert response:", insertResp.body);
  
  if (insertResp.body && !isNaN(parseInt(insertResp.body))) {
    const newId = insertResp.body.trim();
    console.log(`\n  New shipper ID: ${newId}`);
    
    // Now search for it
    const verifyResp = await apiCall("getListRecord", {
      option: "shipper",
      kind: "list",
      idrecord: "-1",
      where: `idshipper=${newId}`,
      orderby: "",
      offset: "-1",
      onlytable: "1",
    }, cookie);
    
    const verifyBody = typeof verifyResp.body === "string" ? verifyResp.body : JSON.stringify(verifyResp.body);
    const verifyRows = verifyBody.match(/id_tr_\d+/g);
    console.log(`  Verify search for idshipper=${newId}: ${verifyRows ? verifyRows.length : 0} rows found`);
    console.log("  Verify HTML:", verifyBody.substring(0, 500));
  }

  console.log("\n=== INVESTIGATION COMPLETE ===");
}

main().catch(console.error);
