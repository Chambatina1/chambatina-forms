const BASE = "https://www.solvedc.com/cargo/cargopack/v1/php/solved/routing.php";
const BUS = "https://www.solvedc.com/cargo/cargopack/v1/php/routing.php";

async function main() {
  const lr = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "funcname=loginUser&user=GEO%20MIA&password=GEO**091223",
  });
  const sc = lr.headers.get("set-cookie") || "";
  const sid = (sc.match(/PHPSESSID=([^;]+)/) || [])[1];
  const cookie = `PHPSESSID=${sid}`;
  const ld = await lr.json();
  console.log("Login OK");

  async function post(url, funcname, params = {}) {
    const body = new URLSearchParams({ funcname, ...params });
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookie },
      body: body.toString(),
    });
    return r;
  }

  // Try different HBL approaches
  console.log("\n=== HBL Approach 1: getHblNumber on business endpoint ===");
  let r = await post(BUS, "getHblNumber", { getcode: "1", kind: "fbc" });
  let t = await r.text();
  console.log("Result:", t);

  console.log("\n=== HBL Approach 2: getHblNumber on solved endpoint ===");
  r = await post(BASE, "getHblNumber", { getcode: "1", kind: "fbc" });
  t = await r.text();
  console.log("Result:", t);

  console.log("\n=== HBL Approach 3: getHblNumber with different params ===");
  r = await post(BUS, "getHblNumber", { getcode: "0", kind: "fbc" });
  t = await r.text();
  console.log("Result:", t);

  console.log("\n=== HBL Approach 4: getHblNumber with kind=air ===");
  r = await post(BUS, "getHblNumber", { getcode: "1", kind: "air" });
  t = await r.text();
  console.log("Result:", t);

  console.log("\n=== HBL Approach 5: getNumberList ===");
  r = await post(BUS, "getNumberList", { option: "reservef", showall: "1", kind: "fbc" });
  t = await r.text();
  console.log("Result:", t.substring(0, 500));

  console.log("\n=== HBL Approach 6: getGuidesList ===");
  r = await post(BUS, "getGuidesList", { option: "reservef", showall: "1", kind: "fbc" });
  t = await r.text();
  console.log("Result:", t.substring(0, 500));

  // Check existing working record to see what HBL looks like
  console.log("\n=== Check existing record 302235 for HBL format ===");
  r = await post(BASE, "getListRecord", {
    option: "reservef",
    where: "r.idreserve = 302235",
    offset: "0", numrows: "1", onlytable: "1",
  });
  t = await r.text();
  // Extract HBL from the row
  const hblMatch = t.match(/id_td_hbl_reservef_\d+.*?title="([^"]*)"/);
  console.log("HBL from record 302235:", hblMatch ? hblMatch[1] : "not found");
  console.log("Full row snippet:", t.substring(t.indexOf("<tr"), t.indexOf("<tr") + 2000));

  // Check what the getListRecord returns for records > 302200 
  console.log("\n=== Check existing API records ===");
  r = await post(BASE, "getListRecord", {
    option: "reservef",
    where: "r.idreserve between 302200 and 302250",
    offset: "0", numrows: "10", onlytable: "1",
  });
  t = await r.text();
  const rows = t.match(/<tr id="id_tr_reservef_\d+">[\s\S]*?<\/tr>/g) || [];
  console.log("Found", rows.length, "rows");
  rows.forEach(row => {
    // Extract key fields
    const id = (row.match(/id_td_idreserve_reservef_\d+.*?title="([^"]*)"/) || [])[1] || "?";
    const hbl = (row.match(/id_td_hbl_reservef_\d+.*?title="([^"]*)"/) || [])[1] || "?";
    const clasif = (row.match(/id_td_idclasification_reservef_\d+.*?title="([^"]*)"/) || [])[1] || "?";
    const goods = (row.match(/id_td_goods_reservef_\d+.*?title="([^"]*)"/) || [])[1] || "?";
    const consignee = (row.match(/id_td_nameconsignee_reservef_\d+.*?title="([^"]*)"/) || [])[1] || "?";
    const shipper = (row.match(/id_td_nameshipper_reservef_\d+.*?title="([^"]*)"/) || [])[1] || "?";
    const fbcguide = (row.match(/id_td_idfbcguide_reservef_\d+.*?title="([^"]*)"/) || [])[1] || "?";
    const guidekind = (row.match(/id_td_idguidekind_reservef_\d+.*?title="([^"]*)"/) || [])[1] || "?";
    console.log(`ID=${id} HBL=${hbl} Clasif=${clasif} Goods=${goods} Consignee=${consignee} Shipper=${shipper} FBCGuide=${fbcguide} GuideKind=${guidekind}`);
  });
}

main().catch(console.error);
