// Test script to verify the correct param mapping for reservef
// and test a properly formed insert

const BASE_URL = "https://www.solvedc.com/cargo/cargopack/v1/php/solved/routing.php";

async function main() {
  // Step 1: Login
  console.log("=== STEP 1: LOGIN ===");
  const loginRes = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "funcname=loginUser&user=GEO%20MIA&password=GEO**091223",
  });
  const setCookie = loginRes.headers.get("set-cookie") || "";
  const sessMatch = setCookie.match(/PHPSESSID=([^;]+)/);
  const phpsessid = sessMatch ? sessMatch[1] : "NO SESSION";
  const loginData = await loginRes.json();
  console.log("Login OK:", JSON.stringify(loginData));
  console.log("PHPSESSID:", phpsessid);

  const cookie = `PHPSESSID=${phpsessid}`;

  async function apiCall(funcname, params = {}) {
    const body = new URLSearchParams({ funcname, ...params });
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookie,
      },
      body: body.toString(),
    });
    return res;
  }

  // Step 2: Get getNewRow to see exact field count and positions
  console.log("\n=== STEP 2: getNewRow for reservef ===");
  const newRowRes = await apiCall("getNewRow", { option: "reservef" });
  const newRowHtml = await newRowRes.text();
  // Count input fields to determine exact field count
  const inputCount = (newRowHtml.match(/id="[^"]*fld[^"]*"/g) || []).length;
  console.log("Number of input fields in getNewRow:", inputCount);
  // Show first 500 chars
  console.log("getNewRow preview:", newRowHtml.substring(0, 800));

  // Step 3: Get getJson for reservef to see ALL fields
  console.log("\n=== STEP 3: getJson for reservef ===");
  const jsonRes = await apiCall("getJson", { option: "reservef" });
  const jsonData = await jsonRes.json();
  console.log("Total fields:", jsonData.length);
  // Print each field with its index, fldtbl, tosave, and notnull
  jsonData.forEach((f, i) => {
    console.log(`  [${i}] fldtbl=${f.fldtbl} tosave=${f.tosave} notnull=${f.notnull} type=${f.type} key=${f.key||''} ${f.fldsql||''}`);
  });

  // Step 4: Get HBL number
  console.log("\n=== STEP 4: Get HBL Number ===");
  const hblRes = await fetch(`${BASE_URL.replace('/php/solved/routing.php', '/php/routing.php')}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookie,
    },
    body: "funcname=getHblNumber&getcode=1&kind=fbc",
  });
  const hblData = await hblRes.json();
  console.log("HBL data:", JSON.stringify(hblData));

  // Step 5: Insert with CORRECT params (ALL fields, 41 positions)
  console.log("\n=== STEP 5: Insert test reserve with ALL 41 fields ===");
  
  // First, let's insert a test shipper
  const shipperRes = await apiCall("insertRecord", {
    option: "shipper",
    params: ";TEST API FIX VERIFY;MIAMI TEST;T12345;3055559999;2000-01-01;USA;test@test.com;AUTO TEST;55",
  });
  const shipperId = (await shipperRes.text()).trim();
  console.log("Test shipper ID:", shipperId);

  // Insert test consignee
  const consigneeRes = await apiCall("insertRecord", {
    option: "consignee",
    params: ";JUAN;CARLOS;PEREZ;GARCIA;A12345678;CUB;5551234;;Calle Test;;Entre A y B;;3;1;1;;test@test.com;API FIX TEST;55",
  });
  const consigneeId = (await consigneeRes.text()).trim();
  console.log("Test consignee ID:", consigneeId);

  // Now insert reserve with ALL 41 fields
  // Based on getJson output, we need to include empty strings for non-tosave fields
  const today = new Date().toISOString().split("T")[0];
  const hbl = hblData.hblnumber || hblData.hblcode || "";

  // Build 41 params - position by position matching ALL fields
  const reserveParams = [
    "",           // [0] idreserve (auto)
    "55",         // [1] identerprise
    "101",        // [2] iduser
    "",           // [3] non-tosave (image?)
    hbl,          // [4] hbl
    "",           // [5] non-tosave (shipped?)
    "",           // [6] non-tosave (idreservestate?)
    "",           // [7] non-tosave (idloadingguide?)
    "",           // [8] idfbcnumber
    "3",          // [9] idfbcguide (3 = ENVIOS FACTURADOS)
    "44",         // [10] idclasification (44 = ENVIO)
    "TEST FIX API", // [11] goods
    "",           // [12] bagnumber
    today,        // [13] datereserve
    "",           // [14] idpurchaser
    consigneeId,  // [15] idconsignee
    "",           // [16] non-tosave (c passport?)
    "",           // [17] non-tosave (c identity?)
    "",           // [18] non-tosave (c street?)
    "",           // [19] non-tosave (c telephone?)
    shipperId,    // [20] idshipper
    "",           // [21] non-tosave (s passport?)
    "",           // [22] non-tosave (s address?)
    "0",          // [23] multhouse
    "",           // [24] non-tosave (p identity?)
    "",           // [25] non-tosave (p passport?)
    "",           // [26] non-tosave (p telephone?)
    "0",          // [27] valuebill
    "0",          // [28] valuedoc
    "1",          // [29] quantity
    "1",          // [30] weight
    "0",          // [31] volume
    "0",          // [32] value
    "4",          // [33] idtypecorrespond (4 = FBC/CPK)
    "3",          // [34] idguidekind (3 = Master)
    "",           // [35] non-tosave (idguidestate?)
    "0",          // [36] non-tosave (valuedanger?)
    "0",          // [37] non-tosave (valuepaied?)
    "API FIX TEST", // [38] observation
    "",           // [39] whnumber
    today,        // [40] entrydate
  ].join(";");
  
  console.log("Reserve params length:", reserveParams.split(";").length);
  console.log("Reserve params:", reserveParams.substring(0, 300));
  
  const reserveRes = await apiCall("insertRecord", {
    option: "reservef",
    params: reserveParams,
  });
  const reserveId = (await reserveRes.text()).trim();
  console.log("Reserve ID:", reserveId);

  // Step 6: Verify the record exists
  console.log("\n=== STEP 6: Verify record exists ===");
  // Small timeout to let DB settle
  await new Promise(r => setTimeout(r, 2000));
  
  const verifyRes = await apiCall("getListRecord", {
    option: "reservef",
    where: `r.idreserve = ${reserveId}`,
    offset: "0",
    numrows: "5",
    onlytable: "1",
  });
  const verifyHtml = await verifyRes.text();
  console.log("Verify response length:", verifyHtml.length);
  console.log("Verify response:", verifyHtml.substring(0, 1500));
  
  // Check if the record shows correct data
  if (verifyHtml.includes("TEST FIX API") && verifyHtml.includes("JUAN") && verifyHtml.includes("TEST API FIX VERIFY")) {
    console.log("\n✅ SUCCESS! Record visible with correct data!");
  } else if (verifyHtml.includes("TEST FIX API")) {
    console.log("\n⚠️ PARTIAL: Record visible but some data may be misaligned");
  } else {
    console.log("\n❌ FAILED: Record not visible or data wrong");
  }

  // Cleanup test records
  console.log("\n=== CLEANUP: Delete test records ===");
  const delShipper = await apiCall("deleteRecordById", { option: "shipper", values: shipperId });
  console.log("Delete shipper:", await delShipper.text());
  const delConsignee = await apiCall("deleteRecordById", { option: "consignee", values: consigneeId });
  console.log("Delete consignee:", await delConsignee.text());
  // Note: reservef might not be easily deletable, but that's OK for testing
}

main().catch(console.error);
