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

  // 1. Check shipper 48603 and consignee 76535 exist
  console.log("=== SHIPPER 48603 ===");
  const s = await post("getListRecord", {
    option: "shipper",
    where: "idshipper = 48603",
    offset: "0", numrows: "5", onlytable: "1",
  });
  const sHtml = await s.text();
  const sRows = (sHtml.match(/id_tr_shipper_/g) || []).length;
  console.log("Found:", sRows, "rows");
  if (sRows > 0) {
    const name = (sHtml.match(/id_td_name_shipper_\d+[^>]*title="([^"]*)"/) || [])[1];
    console.log("Name:", name);
  } else {
    console.log("Shipper 48603 NOT FOUND!");
  }

  console.log("\n=== CONSIGNEE 76535 ===");
  const c = await post("getListRecord", {
    option: "consignee",
    where: "idconsignee = 76535",
    offset: "0", numrows: "5", onlytable: "1",
  });
  const cHtml = await c.text();
  const cRows = (cHtml.match(/id_tr_consignee_/g) || []).length;
  console.log("Found:", cRows, "rows");
  if (cRows > 0) {
    const fn = (cHtml.match(/id_td_firstname_consignee_\d+[^>]*title="([^"]*)"/) || [])[1];
    const sn = (cHtml.match(/id_td_surname_consignee_\d+[^>]*title="([^"]*)"/) || [])[1];
    console.log("Name:", fn, sn);
  } else {
    console.log("Consignee 76535 NOT FOUND!");
  }

  // 2. Deep check record 302250
  console.log("\n=== DEEP CHECK RESERVE 302250 ===");
  const r = await post("getRecord", { option: "reservef", kind: "list", idrecord: "302250" });
  const html = await r.text();
  
  // Find ALL td elements with their titles
  const tds = html.match(/id="id_td_[^"]+reservef[^"]*"[^>]*title="([^"]*)"[^>]*>([^<]*)<\/td>/g) || [];
  console.log("Total TDs found:", tds.length);
  tds.forEach(td => {
    const idMatch = td.match(/id="id_td_(id\w+|name\w+|\w+)_[^"]*"/);
    const titleMatch = td.match(/title="([^"]*)"/);
    if (idMatch && titleMatch && titleMatch[1] !== "_tdcontentt_") {
      console.log(`  ${idMatch[1].replace("_reservef_", "")} = ${titleMatch[1]}`);
    }
  });
}

main().catch(console.error);
