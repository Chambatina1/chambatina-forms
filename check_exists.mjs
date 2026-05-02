const BASE = "https://www.solvedc.com/cargo/cargopack/v1/php/solved/routing.php";

async function main() {
  const lr = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "funcname=loginUser&user=GEO%20MIA&password=GEO**091223",
  });
  const sc = lr.headers.get("set-cookie") || "";
  const sid = (sc.match(/PHPSESSID=([^;]+)/) || [])[1];
  const cookie = `PHPSESSID=${sid}`;
  console.log("Login OK");

  async function post(funcname, params = {}) {
    const body = new URLSearchParams({ funcname, ...params });
    const r = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookie },
      body: body.toString(),
    });
    return r;
  }

  // Check shipper 48603
  console.log("\n=== SHIPPER 48603 ===");
  const s = await post("getRecord", { option: "shipper", kind: "edit", idrecord: "48603" });
  const sHtml = await s.text();
  // Look for input values
  const nameVal = (sHtml.match(/id="id_fld_name_shipper_edit"[^>]*value="([^"]*)"/) || [])[1];
  console.log("Name:", nameVal || "not found in edit");
  console.log("HTML length:", sHtml.length);

  // Check consignee 76535
  console.log("\n=== CONSIGNEE 76535 ===");
  const c = await post("getRecord", { option: "consignee", kind: "edit", idrecord: "76535" });
  const cHtml = await c.text();
  const fnVal = (cHtml.match(/id="id_fld_firstname_consignee_edit"[^>]*value="([^"]*)"/) || [])[1];
  const snVal = (cHtml.match(/id="id_fld_surname_consignee_edit"[^>]*value="([^"]*)"/) || [])[1];
  console.log("Name:", fnVal, snVal || "not found");
  console.log("HTML length:", cHtml.length);

  // Check reserve 302250 directly
  console.log("\n=== RESERVE 302250 (kind=edit) ===");
  const rv = await post("getRecord", { option: "reservef", kind: "edit", idrecord: "302250" });
  const rvHtml = await rv.text();
  console.log("HTML length:", rvHtml.length);
  if (rvHtml.length > 500) {
    // Extract key field values
    const fields = [
      "hbl", "idfbcnumber", "idfbcguide", "idclasification", "goods",
      "datereserve", "idpurchaser", "idconsignee", "idshipper",
      "valuebill", "valuedoc", "quantity", "weight", "idtypecorrespond",
      "idguidekind", "observation", "whnumber", "entrydate"
    ];
    fields.forEach(f => {
      const m = rvHtml.match(new RegExp(`id="id_fld_${f}_reservef_edit"[^>]*value="([^"]*)"`, 'i'));
      if (m) console.log(`  ${f} = ${m[1]}`);
    });
  }

  // Try to list reserves for CHAMBATINA enterprise with no date filter
  console.log("\n=== CHAMBATINA RESERVES (recent, enterprise 55) ===");
  const list = await post("getListRecord", {
    option: "reservef",
    where: "r.identerprise = 55 and r.idreserve > 302240",
    offset: "0", numrows: "15", onlytable: "1",
  });
  const listHtml = await list.text();
  const trs = listHtml.match(/id_tr_reservef_\d+/g) || [];
  console.log("Row count:", trs.length);
  
  // Extract data from each row
  const rowMatches = listHtml.match(/<tr id="id_tr_reservef_(\d+)">[\s\S]*?<\/tr>/g) || [];
  rowMatches.forEach(row => {
    const id = (row.match(/id_td_idreserve_reservef_\d+[^>]*title="(\d+)"/) || [])[1];
    const consignee = (row.match(/id_td_nameconsignee_reservef_\d+[^>]*title="([^"]+)"/) || [])[1];
    const shipper = (row.match(/id_td_nameshipper_reservef_\d+[^>]*title="([^"]+)"/) || [])[1];
    const goods = (row.match(/id_td_goods_reservef_\d+[^>]*title="([^"]+)"/) || [])[1];
    const guide = (row.match(/id_td_idfbcguide_reservef_\d+[^>]*title="([^"]+)"/) || [])[1];
    const clasif = (row.match(/id_td_idclasification_reservef_\d+[^>]*title="([^"]+)"/) || [])[1];
    console.log(`  ID=${id} Consignee=${consignee} Shipper=${shipper} Goods=${goods} Guide=${guide} Clasif=${clasif}`);
  });
}

main().catch(console.error);
