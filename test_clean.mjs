const BASE = "https://www.solvedc.com/cargo/cargopack/v1/php/solved/routing.php";
const BUS = "https://www.solvedc.com/cargo/cargopack/v1/php/routing.php";

async function main() {
  // Login
  const lr = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "funcname=loginUser&user=GEO%20MIA&password=GEO**091223",
  });
  const sc = lr.headers.get("set-cookie") || "";
  const sid = (sc.match(/PHPSESSID=([^;]+)/) || [])[1];
  const ld = await lr.json();
  console.log("Login OK, user:", ld.iduser, "enterprise:", ld.identerprise);
  const cookie = `PHPSESSID=${sid}`;

  async function post(funcname, params = {}, url = BASE) {
    const body = new URLSearchParams({ funcname, ...params });
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookie },
      body: body.toString(),
    });
    return r;
  }

  // 1. Get HBL number first
  console.log("\n=== 1. GET HBL ===");
  const hblR = await post("getHblNumber", { getcode: "1", kind: "fbc" }, BUS);
  const hblT = await hblR.text();
  console.log("HBL raw:", hblT.substring(0, 200));
  let hblNum = "";
  try {
    const hd = JSON.parse(hblT);
    hblNum = hd.hblnumber || hd.hblcode || hd.hawb || "";
  } catch(e) {}
  console.log("HBL parsed:", hblNum || "(empty)");

  // 2. Insert SHIPPER (simple, no @ in email)
  console.log("\n=== 2. INSERT SHIPPER ===");
  const sp = await post("insertRecord", {
    option: "shipper",
    params: ";CHAMBATINA MIAMI;MIAMI FL USA;;3055550000;2000-01-01;USA;;;55",
  });
  const spId = (await sp.text()).trim();
  console.log("Shipper result:", spId);

  // 3. Insert CONSIGNEE (NO email to avoid @ issue, all required fields filled)
  console.log("\n=== 3. INSERT CONSIGNEE ===");
  const cp = await post("insertRecord", {
    option: "consignee",
    params: ";MARIA;TERESA;GARCIA;RODRIGUEZ;A12345678;CUB;5551234;;Calle Principal 123;;;Apto 5;;;1;1;;;55",
  });
  const cpT = await cp.text();
  console.log("Consignee result:", cpT.substring(0, 300));
  const cpId = cpT.trim();
  // Check if it's a valid number
  if (!/^\d+$/.test(cpId)) {
    console.log("ERROR: Consignee insert failed! Using direct approach...");
    // Try without any special chars at all
    const cp2 = await post("insertRecord", {
      option: "consignee",
      params: ";MARIA;TERESA;GARCIA;RODRIGUEZ;A12345678;CUB;5551234;;Calle 123;;;;;;;;1;1;;;55",
    });
    const cp2T = await cp2.text();
    console.log("Consignee retry:", cp2T.substring(0, 300));
  }

  // 4. Verify the shipper and consignee exist
  console.log("\n=== 4. VERIFY SHIPPER ===");
  const vs = await post("getListRecord", {
    option: "shipper",
    where: "idshipper > 48598",
    offset: "0",
    numrows: "3",
    onlytable: "1",
  });
  const vsT = await vs.text();
  console.log("Shipper list:", vsT.substring(0, 1000));

  console.log("\n=== 5. VERIFY CONSIGNEE ===");
  const vc = await post("getListRecord", {
    option: "consignee",
    where: "idconsignee > 76515",
    offset: "0",
    numrows: "3",
    onlytable: "1",
  });
  const vcT = await vc.text();
  console.log("Consignee list:", vcT.substring(0, 1000));

  // 5. Insert RESERVE with correct params
  console.log("\n=== 6. INSERT RESERVE (25 params, correct mapping) ===");
  const today = "2026-05-02";
  
  const reserveParams = [
    "",                    // [0] idreserve (auto)
    "55",                  // [1] identerprise
    "101",                 // [2] iduser
    hblNum,                // [3] hbl
    "",                    // [4] idfbcnumber
    "3",                   // [5] idfbcguide = 3 (ENVIOS FACTURADOS) ← KEY FIX!
    "44",                  // [6] idclasification = 44 (ENVIO)
    "ROPA Y CALZADO",      // [7] goods
    "",                    // [8] bagnumber
    today,                 // [9] datereserve
    "",                    // [10] idpurchaser
    cpId,                  // [11] idconsignee
    spId,                  // [12] idshipper
    "0",                   // [13] multhouse
    "0",                   // [14] valuebill
    "0",                   // [15] valuedoc
    "2",                   // [16] quantity
    "3.5",                 // [17] weight
    "0",                   // [18] volume
    "0",                   // [19] value
    "4",                   // [20] idtypecorrespond = 4 (FBC/CPK)
    "3",                   // [21] idguidekind = 3 (Master) ← KEY FIX!
    "PRUEBA DESDE API",    // [22] observation
    "",                    // [23] whnumber
    today,                 // [24] entrydate
  ].join(";");
  
  const rv = await post("insertRecord", {
    option: "reservef",
    params: reserveParams,
  });
  const rvT = await rv.text();
  console.log("Reserve result:", rvT.substring(0, 300));
  const rvId = rvT.trim();

  // 6. Verify the reserve
  console.log("\n=== 7. VERIFY RESERVE ===");
  await new Promise(r => setTimeout(r, 2000));
  
  const vr = await post("getRecord", {
    option: "reservef",
    kind: "edit",
    idrecord: rvId,
  });
  const vrT = await vr.text();
  console.log("Reserve edit response length:", vrT.length);
  if (vrT.length > 0) {
    console.log("Reserve edit:", vrT.substring(0, 2000));
  }

  // Also check list
  const vl = await post("getListRecord", {
    option: "reservef",
    where: `r.idreserve = ${rvId}`,
    offset: "0",
    numrows: "5",
    onlytable: "1",
  });
  const vlT = await vl.text();
  console.log("\nReserve list length:", vlT.length);
  if (vlT.length > 500) {
    console.log("Reserve list preview:", vlT.substring(0, 3000));
  } else {
    console.log("Reserve list:", vlT);
  }

  console.log("\n=== FINAL CHECKS ===");
  const hasGoods = vlT.includes("ROPA Y CALZADO");
  const hasConsignee = vlT.includes("MARIA") || vlT.includes("GARCIA");
  const hasShipper = vlT.includes("CHAMBATINA");
  const hasHbl = hblNum && vlT.includes(hblNum);
  const hasEnvio = vlT.includes("ENVIO");
  
  console.log("Has goods (ROPA Y CALZADO):", hasGoods ? "✅" : "❌");
  console.log("Has consignee (MARIA/GARCIA):", hasConsignee ? "✅" : "❌");
  console.log("Has shipper (CHAMBATINA):", hasShipper ? "✅" : "❌");
  console.log("Has HBL (" + hblNum + "):", hasHbl ? "✅" : "❌");
  console.log("Has clasification ENVIO:", hasEnvio ? "✅" : "❌");
  
  if (hasGoods && hasConsignee && hasShipper) {
    console.log("\n🎉 SUCCESS! All data correctly visible in SolvedCargo!");
  } else {
    console.log("\n⚠️ Partial results - some fields may be off");
  }
}

main().catch(console.error);
