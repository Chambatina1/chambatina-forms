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
  console.log("Login OK, session:", sid);

  async function post(funcname, params = {}) {
    const body = new URLSearchParams({ funcname, ...params });
    const r = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookie },
      body: body.toString(),
    });
    return r;
  }

  // 1. Check if shipper 48601 and consignee 76533 exist
  console.log("\n=== CHECK SHIPPER 48601 ===");
  const s = await post("getRecord", { option: "shipper", kind: "edit", idrecord: "48601" });
  const sHtml = await s.text();
  console.log("Shipper length:", sHtml.length);
  if (sHtml.length > 100) {
    // Extract field values from the edit form
    const nameMatch = sHtml.match(/id="id_fld_name_shipper_edit"[^>]*value="([^"]*)"/);
    console.log("Name:", nameMatch ? nameMatch[1] : "not found");
  }

  console.log("\n=== CHECK CONSIGNEE 76533 ===");
  const c = await post("getRecord", { option: "consignee", kind: "edit", idrecord: "76533" });
  const cHtml = await c.text();
  console.log("Consignee length:", cHtml.length);
  if (cHtml.length > 100) {
    const fnMatch = cHtml.match(/id="id_fld_firstname_consignee_edit"[^>]*value="([^"]*)"/);
    console.log("Firstname:", fnMatch ? fnMatch[1] : "not found");
  }

  // 2. Check reserve 302247 with option=reserve (not reservef)
  console.log("\n=== CHECK RESERVE 302247 (option=reserve) ===");
  const r1 = await post("getRecord", { option: "reserve", kind: "edit", idrecord: "302247" });
  const r1Html = await r1.text();
  console.log("Reserve (reserve) edit length:", r1Html.length);
  
  console.log("\n=== CHECK RESERVE 302247 (option=reservef) ===");
  const r2 = await post("getRecord", { option: "reservef", kind: "edit", idrecord: "302247" });
  const r2Html = await r2.text();
  console.log("Reserve (reservef) edit length:", r2Html.length);
  
  // 3. Try to UPDATE record 302247 - if it exists, update should work
  console.log("\n=== ATTEMPT UPDATE RESERVE 302247 ===");
  const u = await post("updateRecord", {
    option: "reservef",
    params: "302247;55;101;TEST-HBL;3;3;44;ROPA Y CALZADO;;2026-05-02;;76533;48601;0;0;0;2;3.5;0;0;4;3;PRUEBA UPDATE;;2026-05-02",
  });
  const uText = await u.text();
  console.log("Update result:", uText.substring(0, 300));

  // 4. Check reserve 302235 (known working) with updateRecord to see param format
  console.log("\n=== GET RECORD 302235 FIELDS ===");
  const r3 = await post("getRecord", { option: "reservef", kind: "edit", idrecord: "302235" });
  const r3Html = await r3.text();
  // Try to find input fields with their values
  const inputs = r3Html.match(/id="id_fld_[^"]*"[^>]*value="[^"]*"/g) || [];
  inputs.slice(0, 30).forEach(inp => {
    console.log(" ", inp);
  });

  // 5. List recent reserves (try different where clauses)
  console.log("\n=== LIST RECENT RESERVES (no enterprise filter) ===");
  const l1 = await post("getListRecord", {
    option: "reservef",
    where: "r.idreserve > 302230 and r.idreserve < 302250",
    offset: "0", numrows: "20", onlytable: "1",
  });
  const l1Html = await l1.text();
  const l1Rows = (l1Html.match(/id_tr_reservef_/g) || []).length;
  console.log("Rows found:", l1Rows);
  if (l1Rows > 0) {
    const trs = l1Html.match(/<tr id="id_tr_reservef_\d+">[\s\S]*?<\/tr>/g) || [];
    trs.forEach(tr => {
      const id = (tr.match(/id_td_idreserve_reservef_\d+[^>]*title="([^"]*)"/) || [])[1] || "?";
      const hbl = (tr.match(/id_td_hbl_reservef_\d+[^>]*title="([^"]*)"/) || [])[1] || "?";
      const consignee = (tr.match(/id_td_nameconsignee_reservef_\d+[^>]*title="([^"]*)"/) || [])[1] || "?";
      const shipper = (tr.match(/id_td_nameshipper_reservef_\d+[^>]*title="([^"]*)"/) || [])[1] || "?";
      console.log(`  ID=${id} HBL=${hbl} Consignee=${consignee} Shipper=${shipper}`);
    });
  }

  // 6. Try option=reserve (not reservef) for listing
  console.log("\n=== LIST RESERVES (option=reserve) ===");
  const l2 = await post("getListRecord", {
    option: "reserve",
    where: "idreserve > 302230",
    offset: "0", numrows: "10", onlytable: "1",
  });
  const l2Html = await l2.text();
  const l2Rows = (l2Html.match(/id_tr_reserve_/g) || []).length;
  console.log("Rows found:", l2Rows);
}

main().catch(console.error);
