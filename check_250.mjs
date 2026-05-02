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

  async function post(funcname, params = {}) {
    const body = new URLSearchParams({ funcname, ...params });
    const r = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookie },
      body: body.toString(),
    });
    return r;
  }

  // Search for 302250 specifically
  console.log("=== RESERVE 302250 (user synced via admin) ===");
  const r1 = await post("getListRecord", {
    option: "reservef",
    where: "r.idreserve = 302250",
    offset: "0", numrows: "5", onlytable: "1",
  });
  const html1 = await r1.text();
  const rows1 = (html1.match(/id_tr_reservef_/g) || []).length;
  console.log("Rows:", rows1);

  // Also try with idreserve > 302248
  console.log("\n=== RECENT RESERVES (idreserve > 302248) ===");
  const r2 = await post("getListRecord", {
    option: "reservef",
    where: "r.idreserve > 302248",
    offset: "0", numrows: "5", onlytable: "1",
  });
  const html2 = await r2.text();
  const rows2 = (html2.match(/id_tr_reservef_/g) || []).length;
  console.log("Rows:", rows2);

  // Extract all IDs and key data from the recent records  
  const trs = html2.match(/<tr id="id_tr_reservef_\d+">[\s\S]*?<\/tr>/g) || [];
  trs.forEach(tr => {
    const id = (tr.match(/id_td_idreserve_reservef_\d+[^>]*title="([^"]*)"/) || [])[1] || "?";
    const hbl = (tr.match(/id_td_hbl_reservef_\d+[^>]*title="([^"]*)"/) || [])[1] || "?";
    const consignee = (tr.match(/id_td_nameconsignee_reservef_\d+[^>]*title="([^"]*)"/) || [])[1] || "?";
    const shipper = (tr.match(/id_td_nameshipper_reservef_\d+[^>]*title="([^"]*)"/) || [])[1] || "?";
    const goods = (tr.match(/id_td_goods_reservef_\d+[^>]*title="([^"]*)"/) || [])[1] || "?";
    const clasif = (tr.match(/id_td_idclasification_reservef_\d+[^>]*title="([^"]*)"/) || [])[1] || "?";
    const guide = (tr.match(/id_td_idfbcguide_reservef_\d+[^>]*title="([^"]*)"/) || [])[1] || "?";
    console.log(`\nID=${id} HBL=${hbl}`);
    console.log(`  Consignee: ${consignee}`);
    console.log(`  Shipper: ${shipper}`);
    console.log(`  Goods: ${goods}`);
    console.log(`  Clasif: ${clasif}`);
    console.log(`  Guide: ${guide}`);
  });

  // If no rows with r.idreserve > 302248, try wider range
  if (trs.length === 0) {
    console.log("\n=== Trying idreserve > 302245 ===");
    const r3 = await post("getListRecord", {
      option: "reservef",
      where: "r.idreserve > 302245",
      offset: "0", numrows: "10", onlytable: "1",
    });
    const html3 = await r3.text();
    const trs3 = html3.match(/<tr id="id_tr_reservef_\d+">[\s\S]*?<\/tr>/g) || [];
    console.log("Rows:", trs3.length);
    trs3.forEach(tr => {
      const id = (tr.match(/id_td_idreserve_reservef_\d+[^>]*title="([^"]*)"/) || [])[1] || "?";
      const consignee = (tr.match(/id_td_nameconsignee_reservef_\d+[^>]*title="([^"]*)"/) || [])[1] || "?";
      const shipper = (tr.match(/id_td_nameshipper_reservef_\d+[^>]*title="([^"]*)"/) || [])[1] || "?";
      const goods = (tr.match(/id_td_goods_reservef_\d+[^>]*title="([^"]*)"/) || [])[1] || "?";
      const clasif = (tr.match(/id_td_idclasification_reservef_\d+[^>]*title="([^"]*)"/) || [])[1] || "?";
      console.log(`ID=${id}: Consignee=${consignee} Shipper=${shipper} Goods=${goods} Clasif=${clasif}`);
    });
  }
}

main().catch(console.error);
