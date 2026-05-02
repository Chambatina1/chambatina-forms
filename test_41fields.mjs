// Test que replica exactamente lo que el nuevo código haría
// usando 41 params con placeholders en posiciones de display

const BASE = "https://www.solvedc.com/cargo/cargopack/v1/php/solved/routing.php";

async function main() {
  // Login
  const lr = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "funcname=loginUser&user=GEO%20MIA&password=GEO**091223",
  });
  const sc = lr.headers.get("set-cookie") || "";
  const sid = (sc.match(/PHPSESSID=([^;]+)/) || [])[1];
  const cookie = `PHPSESSID=${sid}`;
  const ld = await lr.json();
  console.log("Login OK, iduser:", ld.iduser, "identerprise:", ld.identerprise);

  async function post(funcname, params = {}) {
    const body = new URLSearchParams({ funcname, ...params });
    const r = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookie },
      body: body.toString(),
    });
    return r;
  }

  // Step 1: Insert shipper (10 params, all tosave)
  console.log("\n=== SHIPPER ===");
  const shipperParams = ";CHAMBATINA MIAMI;MIAMI FL USA;;3055550000;2000-01-01;USA;;55";
  const sp = await post("insertRecord", { option: "shipper", params: shipperParams });
  const spText = await sp.text();
  console.log("Result:", spText);
  if (!/^\d+$/.test(spText.trim())) {
    console.log("ERROR: Shipper insert failed:", spText);
    return;
  }
  const shipperId = spText.trim();

  // Step 2: Insert consignee (21 params, all tosave)
  console.log("\n=== CONSIGNEE ===");
  const consigneeParams = [
    "",        // [0] idconsignee (auto)
    "MARIA",   // [1] firstname
    "TERESA",  // [2] secondname
    "GARCIA",  // [3] surname
    "RODRIGUEZ", // [4] sndsurname
    "",        // [5] passport
    "88010101010", // [6] identity (carnet)
    "CUB",     // [7] nacionality
    "5551234", // [8] telephone
    "",        // [9] mobile
    "Calle Principal 123", // [10] street
    "",        // [11] building
    "",        // [12] between1
    "",        // [13] between2
    "",        // [14] apartment
    "",        // [15] floor
    "1",       // [16] idmunicipality
    "1",       // [17] idprovince
    "",        // [18] email (vacío para evitar @)
    "",        // [19] observation
    "55",      // [20] identerprise
  ].join(";");
  const cp = await post("insertRecord", { option: "consignee", params: consigneeParams });
  const cpText = await cp.text();
  console.log("Result:", cpText);
  if (!/^\d+$/.test(cpText.trim())) {
    console.log("ERROR: Consignee insert failed:", cpText);
    return;
  }
  const consigneeId = cpText.trim();

  // Step 3: Insert reserve with CORRECT 41-field format
  console.log("\n=== RESERVE (41 params) ===");
  const today = "2026-05-02";
  const reserveParams = [
    "",           // [0]  idreserve (auto)
    "55",         // [1]  identerprise
    "101",        // [2]  iduser
    "",           // [3]  ★ DISPLAY: image (SKIP)
    "",           // [4]  hbl (vacío por ahora)
    "",           // [5]  ★ DISPLAY: shipped (SKIP)
    "",           // [6]  ★ DISPLAY: idreservestate (SKIP)
    "",           // [7]  ★ DISPLAY: idloadingguide (SKIP)
    "",           // [8]  idfbcnumber
    "3",          // [9]  ★ idfbcguide = 3 (ENVIOS FACTURADOS)
    "44",         // [10] ★ idclasification = 44 (ENVIO)
    "ROPA Y CALZADO", // [11] goods
    "",           // [12] bagnumber
    today,        // [13] datereserve
    "",           // [14] idpurchaser
    consigneeId,  // [15] idconsignee
    "",           // [16] ★ DISPLAY: c.passport (SKIP)
    "",           // [17] ★ DISPLAY: c.identity (SKIP)
    "",           // [18] ★ DISPLAY: c.street (SKIP)
    "",           // [19] ★ DISPLAY: c.telephone (SKIP)
    shipperId,    // [20] idshipper
    "",           // [21] ★ DISPLAY: s.passport (SKIP)
    "",           // [22] ★ DISPLAY: s.address (SKIP)
    "",           // [23] multhouse
    "",           // [24] ★ DISPLAY: p.identity (SKIP)
    "",           // [25] ★ DISPLAY: p.passport (SKIP)
    "",           // [26] ★ DISPLAY: p.telephone (SKIP)
    "",           // [27] valuebill
    "",           // [28] valuedoc
    "2",          // [29] quantity
    "3.5",        // [30] weight
    "",           // [31] volume
    "",           // [32] value
    "4",          // [33] ★ idtypecorrespond = 4 (FBC/CPK)
    "3",          // [34] ★ idguidekind = 3 (Master)
    "",           // [35] ★ DISPLAY: idguidestate (SKIP)
    "",           // [36] ★ DISPLAY: valuedanger (SKIP)
    "",           // [37] ★ DISPLAY: valuepaied (SKIP)
    "PRUEBA API 41 CAMPOS", // [38] observation
    "",           // [39] whnumber
    today,        // [40] entrydate
  ].join(";");

  console.log("Total params:", reserveParams.split(";").length);
  const rv = await post("insertRecord", { option: "reservef", params: reserveParams });
  const rvText = await rv.text();
  console.log("Result:", rvText);
  if (!/^\d+$/.test(rvText.trim())) {
    console.log("ERROR: Reserve insert failed:", rvText.substring(0, 500));
    return;
  }
  const reserveId = rvText.trim();
  console.log("Reserve ID:", reserveId);

  // Step 4: Verify
  console.log("\n=== VERIFICATION (esperando 3s...) ===");
  await new Promise(r => setTimeout(r, 3000));

  const vl = await post("getListRecord", {
    option: "reservef",
    where: `r.idreserve = ${reserveId}`,
    offset: "0", numrows: "5", onlytable: "1",
  });
  const vlHtml = await vl.text();
  const trs = (vlHtml.match(/<tr id="id_tr_reservef_\d+">[\s\S]*?<\/tr>/g) || []);
  console.log("Rows found:", trs.length);

  if (trs.length > 0) {
    console.log("\n✅ RECORD ENCONTRADO!");
    trs.forEach(tr => {
      // Extract all td values
      const tds = tr.match(/<td[^>]*title="([^"]*)"[^>]*>([^<]*)<\/td>/g) || [];
      tds.forEach(td => {
        const m = td.match(/title="([^"]*)"/);
        if (m && m[1] && m[1] !== "_tdcontentt_") {
          console.log(`  ${m[1]}`);
        }
      });
    });
  } else {
    console.log("No se encontró el registro. Verificando con r.idreserve > valor...");
    
    // Try listing recent records
    const vl2 = await post("getListRecord", {
      option: "reservef",
      where: `r.idreserve > ${parseInt(reserveId) - 10}`,
      offset: "0", numrows: "15", onlytable: "1",
    });
    const vl2Html = await vl2.text();
    const trs2 = (vl2Html.match(/<tr id="id_tr_reservef_\d+">[\s\S]*?<\/tr>/g) || []);
    console.log("Recent rows found:", trs2.length);
    trs2.forEach(tr => {
      const idMatch = tr.match(/id="id_td_idreserve_reservef_\d+"[^>]*title="([^"]*)"/);
      const hblMatch = tr.match(/id="id_td_hbl_reservef_\d+"[^>]*title="([^"]*)"/);
      const goodsMatch = tr.match(/id="id_td_goods_reservef_\d+"[^>]*title="([^"]*)"/);
      const consMatch = tr.match(/id="id_td_nameconsignee_reservef_\d+"[^>]*title="([^"]*)"/);
      const shipMatch = tr.match(/id="id_td_nameshipper_reservef_\d+"[^>]*title="([^"]*)"/);
      console.log(`  ID=${idMatch?.[1]||'?'} HBL=${hblMatch?.[1]||'?'} Goods=${goodsMatch?.[1]||'?'} Consignee=${consMatch?.[1]||'?'} Shipper=${shipMatch?.[1]||'?'}`);
    });
  }

  // Also check via getRecord kind=list
  console.log("\n=== getRecord kind=list ===");
  const gr = await post("getRecord", {
    option: "reservef", kind: "list", idrecord: reserveId,
  });
  const grHtml = await gr.text();
  // Search for the data in the HTML
  const hasGoods = grHtml.includes("ROPA Y CALZADO");
  const hasConsignee = grHtml.includes("MARIA") || grHtml.includes("GARCIA");
  const hasShipper = grHtml.includes("CHAMBATINA");
  const hasObs = grHtml.includes("PRUEBA API 41 CAMPOS");
  const hasEnvio = grHtml.includes("ENVIO");
  console.log("HTML length:", grHtml.length);
  console.log("Has goods:", hasGoods ? "✅" : "❌");
  console.log("Has consignee:", hasConsignee ? "✅" : "❌");
  console.log("Has shipper:", hasShipper ? "✅" : "❌");
  console.log("Has observation:", hasObs ? "✅" : "❌");
  console.log("Has ENVIO:", hasEnvio ? "✅" : "❌");
  
  if (hasGoods && hasConsignee && hasShipper) {
    console.log("\n🎉 ÉXITO TOTAL! Los datos se muestran correctamente en SolvedCargo!");
  } else {
    console.log("\n⚠️ Verificar manualmente en el panel de SolvedCargo");
  }
}

main().catch(console.error);
