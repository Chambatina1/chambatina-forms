const BASE_URL = "https://www.solvedc.com/cargo/cargopack/v1/php/solved/routing.php";
const BUS_URL = "https://www.solvedc.com/cargo/cargopack/v1/php/routing.php";

async function main() {
  // Login
  const loginRes = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "funcname=loginUser&user=GEO%20MIA&password=GEO**091223",
  });
  const setCookie = loginRes.headers.get("set-cookie") || "";
  const sessMatch = setCookie.match(/PHPSESSID=([^;]+)/);
  const cookie = `PHPSESSID=${sessMatch[1]}`;
  const loginData = await loginRes.json();
  console.log("Login OK, user:", loginData.iduser);

  async function api(funcname, params = {}, url = BASE_URL) {
    const body = new URLSearchParams({ funcname, ...params });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookie },
      body: body.toString(),
    });
    return res;
  }

  // Step 1: Get FULL schema
  console.log("\n=== SCHEMA (getJson reservef) ===");
  const jsonRes = await api("getJson", { option: "reservef" });
  const jsonText = await jsonRes.text();
  // Parse - might be wrapped
  let jsonData;
  try {
    jsonData = JSON.parse(jsonText);
    if (!Array.isArray(jsonData)) {
      console.log("getJson raw keys:", Object.keys(jsonData));
      // Try to find the array
      for (const key of Object.keys(jsonData)) {
        if (Array.isArray(jsonData[key])) {
          jsonData = jsonData[key];
          console.log("Found array in key:", key);
          break;
        }
      }
    }
  } catch(e) {
    console.log("getJson parse error:", e.message);
    console.log("Raw:", jsonText.substring(0, 500));
    return;
  }

  if (Array.isArray(jsonData)) {
    console.log("Total fields:", jsonData.length);
    jsonData.forEach((f, i) => {
      const tosave = f.tosave !== false && f.tosave !== "false" ? "SAVE" : "disp";
      const nn = f.notnull ? "NN" : "  ";
      console.log(`  [${String(i).padStart(2)}] ${tosave} ${nn} fld=${f.fldtbl || f.fldname || '?'} type=${f.type || '?'} ${f.key ? 'FK' : ''}`);
    });
  }

  // Step 2: Get HBL number
  console.log("\n=== HBL NUMBER ===");
  const hblRes = await api("getHblNumber", { getcode: "1", kind: "fbc" }, BUS_URL);
  const hblText = await hblRes.text();
  console.log("HBL response:", hblText.substring(0, 300));
  let hblNumber = "";
  try {
    const hblData = JSON.parse(hblText);
    hblNumber = hblData.hblnumber || hblData.hblcode || "";
    console.log("HBL number:", hblNumber);
  } catch(e) {
    console.log("HBL parse failed, will use empty");
  }

  // Step 3: Insert test shipper + consignee
  console.log("\n=== INSERT TEST SHIPPER ===");
  const tsRes = await api("insertRecord", {
    option: "shipper",
    params: ";TEST_VERIFY_FIX;123 Test St;T99999;3055551234;2000-01-01;USA;test@verify.com;VERIFY TEST;55",
  });
  const shipperId = (await tsRes.text()).trim();
  console.log("Shipper ID:", shipperId);

  console.log("\n=== INSERT TEST CONSIGNEE ===");
  const tcRes = await api("insertRecord", {
    option: "consignee",
    params: ";CARLOS;ALBERTO;RODRIGUEZ;MARTINEZ;A99999999;CUB;5551234;;Calle Verify;;Entre X;Y;;3;1;1;carlos@verify.com;VERIFY TEST;55",
  });
  const consigneeId = (await tcRes.text()).trim();
  console.log("Consignee ID:", consigneeId);

  // Step 4: Insert reserve with ALL 41 field positions
  console.log("\n=== INSERT RESERVE (41 fields) ===");
  const today = new Date().toISOString().split("T")[0];
  const params41 = [
    "",                // [0] idreserve (auto)
    "55",              // [1] identerprise
    "101",             // [2] iduser
    "",                // [3] image (display only)
    hblNumber,         // [4] hbl
    "",                // [5] shipped (display only)
    "",                // [6] idreservestate (display only)
    "",                // [7] idloadingguide (display only)
    "",                // [8] idfbcnumber
    "3",               // [9] idfbcguide = 3 (ENVIOS FACTURADOS)
    "44",              // [10] idclasification = 44 (ENVIO)
    "ROPA Y CALZADO TEST", // [11] goods
    "",                // [12] bagnumber
    today,             // [13] datereserve
    "",                // [14] idpurchaser
    consigneeId,       // [15] idconsignee
    "",                // [16] consignee passport (display)
    "",                // [17] consignee identity (display)
    "",                // [18] consignee street (display)
    "",                // [19] consignee telephone (display)
    shipperId,         // [20] idshipper
    "",                // [21] shipper passport (display)
    "",                // [22] shipper address (display)
    "0",               // [23] multhouse
    "",                // [24] purchaser identity (display)
    "",                // [25] purchaser passport (display)
    "",                // [26] purchaser telephone (display)
    "0",               // [27] valuebill
    "0",               // [28] valuedoc
    "2",               // [29] quantity
    "3.5",             // [30] weight
    "0",               // [31] volume
    "0",               // [32] value
    "4",               // [33] idtypecorrespond = 4 (FBC/CPK)
    "3",               // [34] idguidekind = 3 (Master)
    "",                // [35] idguidestate (display)
    "0",               // [36] valuedanger (display)
    "0",               // [37] valuepaied (display)
    "API VERIFY TEST", // [38] observation
    "",                // [39] whnumber
    today,             // [40] entrydate
  ];
  
  console.log("Total params:", params41.length);
  const reserveRes = await api("insertRecord", {
    option: "reservef",
    params: params41.join(";"),
  });
  const reserveId = (await reserveRes.text()).trim();
  console.log("Reserve ID:", reserveId);

  // Step 5: Verify with getRecord
  console.log("\n=== VERIFY (getRecord) ===");
  await new Promise(r => setTimeout(r, 2000));
  
  const verifyRes = await api("getRecord", {
    option: "reservef",
    kind: "edit",
    idrecord: reserveId,
  });
  const verifyHtml = await verifyRes.text();
  
  // Parse the verification response
  console.log("Verify response length:", verifyHtml.length);
  // Show relevant parts
  const hasGoods = verifyHtml.includes("ROPA Y CALZADO TEST");
  const hasConsignee = verifyHtml.includes("CARLOS") || verifyHtml.includes(consigneeId);
  const hasShipper = verifyHtml.includes("TEST_VERIFY_FIX") || verifyHtml.includes(shipperId);
  const hasHbl = verifyHtml.includes(hblNumber) && hblNumber.length > 0;
  const hasClasif = verifyHtml.includes("ENVIO");
  const hasGuideKind = verifyHtml.includes("Master") || verifyHtml.includes("3");
  
  console.log("--- Field Verification ---");
  console.log("Has goods (ROPA Y CALZADO TEST):", hasGoods ? "✅" : "❌");
  console.log("Has consignee (CARLOS / ID):", hasConsignee ? "✅" : "❌");
  console.log("Has shipper (TEST_VERIFY_FIX / ID):", hasShipper ? "✅" : "❌");
  console.log("Has HBL:", hasHbl ? "✅" : "❌ (" + hblNumber + ")");
  console.log("Has clasification (ENVIO):", hasClasif ? "✅" : "❌");
  console.log("Has guidekind (Master):", hasGuideKind ? "✅" : "❌");
  
  // Also check with getListRecord
  console.log("\n=== LIST VERIFY ===");
  const listRes = await api("getListRecord", {
    option: "reservef",
    where: `r.idreserve = ${reserveId}`,
    offset: "0",
    numrows: "5",
    onlytable: "1",
  });
  const listHtml = await listRes.text();
  console.log("List response length:", listHtml.length);
  console.log("List HTML preview:", listHtml.substring(0, 2000));
  
  const listHasGoods = listHtml.includes("ROPA Y CALZADO TEST");
  const listHasConsignee = listHtml.includes("CARLOS");
  const listHasShipper = listHtml.includes("TEST_VERIFY_FIX");
  const listHasHbl = listHtml.includes(hblNumber) && hblNumber.length > 0;
  
  console.log("\n--- List Field Verification ---");
  console.log("List has goods:", listHasGoods ? "✅" : "❌");
  console.log("List has consignee:", listHasConsignee ? "✅" : "❌");
  console.log("List has shipper:", listHasShipper ? "✅" : "❌");
  console.log("List has HBL:", listHasHbl ? "✅" : "❌ (" + hblNumber + ")");
  
  if (listHasGoods && listHasConsignee && listHasShipper) {
    console.log("\n🎉 SUCCESS! The 41-field approach works correctly!");
  } else {
    console.log("\n❌ Something still wrong. Need to investigate further.");
    // Let's see what the list actually shows
    if (listHtml.length > 0) {
      console.log("\nFull list HTML for analysis:");
      console.log(listHtml.substring(0, 3000));
    }
  }

  // Cleanup
  console.log("\n=== CLEANUP ===");
  await api("deleteRecordById", { option: "shipper", values: shipperId });
  await api("deleteRecordById", { option: "consignee", values: consigneeId });
  console.log("Cleanup done (shipper + consignee deleted, reserve left for inspection)");
}

main().catch(console.error);
