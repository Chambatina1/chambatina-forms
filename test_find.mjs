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

  // Try to get record 302247 with different approaches
  console.log("=== Approach 1: getRecord kind=edit idrecord=302247 ===");
  const r1 = await post("getRecord", { option: "reservef", kind: "edit", idrecord: "302247" });
  const t1 = await r1.text();
  console.log("Length:", t1.length, "Content:", t1.substring(0, 500) || "(empty)");

  console.log("\n=== Approach 2: getListRecord with idreserve filter ===");
  const r2 = await post("getListRecord", {
    option: "reservef",
    where: "idreserve = 302247",
    offset: "0", numrows: "5", onlytable: "1",
  });
  const t2 = await r2.text();
  // Count data rows
  const trCount = (t2.match(/id_tr_reservef_/g) || []).length;
  console.log("TR count:", trCount, "Length:", t2.length);
  // Show just data rows
  const trs = t2.match(/<tr id="id_tr_reservef_[^"]*">[\s\S]*?<\/tr>/g) || [];
  trs.forEach((tr, i) => console.log(`Row ${i}:`, tr.substring(0, 500)));

  console.log("\n=== Approach 3: getListRecord r.idreserve filter ===");
  const r3 = await post("getListRecord", {
    option: "reservef",
    where: "r.idreserve = 302247",
    offset: "0", numrows: "5", onlytable: "1",
  });
  const t3 = await r3.text();
  const tr3Count = (t3.match(/id_tr_reservef_/g) || []).length;
  console.log("TR count:", tr3Count, "Length:", t3.length);
  const trs3 = t3.match(/<tr id="id_tr_reservef_[^"]*">[\s\S]*?<\/tr>/g) || [];
  trs3.forEach((tr, i) => console.log(`Row ${i}:`, tr.substring(0, 500)));

  console.log("\n=== Approach 4: getListRecord recent reserves ===");
  const r4 = await post("getListRecord", {
    option: "reservef",
    where: "idreserve > 302240",
    offset: "0", numrows: "10", onlytable: "1",
  });
  const t4 = await r4.text();
  const tr4Count = (t4.match(/id_tr_reservef_/g) || []).length;
  console.log("TR count:", tr4Count, "Length:", t4.length);
  const trs4 = t4.match(/<tr id="id_tr_reservef_[^"]*">[\s\S]*?<\/tr>/g) || [];
  trs4.forEach((tr, i) => console.log(`Row ${i}:`, tr.substring(0, 800)));

  console.log("\n=== Approach 5: Get the known working record 302235 ===");
  const r5 = await post("getListRecord", {
    option: "reservef",
    where: "r.idreserve = 302235",
    offset: "0", numrows: "5", onlytable: "1",
  });
  const t5 = await r5.text();
  const tr5Count = (t5.match(/id_tr_reservef_/g) || []).length;
  console.log("TR count:", tr5Count, "Length:", t5.length);
  const trs5 = t5.match(/<tr id="id_tr_reservef_[^"]*">[\s\S]*?<\/tr>/g) || [];
  trs5.forEach((tr, i) => console.log(`Row ${i}:`, tr.substring(0, 1500)));

  console.log("\n=== Approach 6: Compare 302235 (works) vs 302247 (API) ===");
  const r6a = await post("getRecord", { option: "reservef", kind: "list", idrecord: "302235" });
  const t6a = await r6a.text();
  console.log("302235 (works) edit response length:", t6a.length);
  if (t6a.length > 0) console.log("302235:", t6a.substring(0, 1500));

  const r6b = await post("getRecord", { option: "reservef", kind: "list", idrecord: "302247" });
  const t6b = await r6b.text();
  console.log("\n302247 (API) edit response length:", t6b.length);
  if (t6b.length > 0) console.log("302247:", t6b.substring(0, 1500));

  // Try updateRecord to see if we can read the data back
  console.log("\n=== Approach 7: Read existing record fields ===");
  const r7 = await post("getRecord", { option: "reservef", kind: "newlist", idrecord: "302247" });
  const t7 = await r7.text();
  console.log("newlist length:", t7.length, t7.substring(0, 500));
}

main().catch(console.error);
