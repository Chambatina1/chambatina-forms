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

  // Check reserve 302250 (the one synced with new code)
  console.log("\n=== RESERVE 302250 (nuevo código) ===");
  const r1 = await post("getRecord", { option: "reservef", kind: "list", idrecord: "302250" });
  const html1 = await r1.text();

  const checks = [
    ["MARIA LOLA (consignee)", html1.includes("MARIA LOLA")],
    ["LOLO (shipper)", html1.includes("LOLO")],
    ["ROPA (goods)", html1.includes("ROPA")],
    ["ENVIO (clasification)", html1.includes("ENVIO")],
    ["identerprise=55", html1.includes("55")],
  ];
  
  console.log("Verificación:");
  checks.forEach(([label, ok]) => console.log(`  ${ok ? "✅" : "❌"} ${label}`));
  
  if (checks.every(c => c[1])) {
    console.log("\n🎉 El envío 302250 está CORRECTO en SolvedCargo!");
  } else {
    console.log("\n⚠️ Algunos datos no coinciden");
  }

  // Also check the old record 302148 for comparison
  console.log("\n=== RESERVE 302148 (código viejo) ===");
  const r2 = await post("getRecord", { option: "reservef", kind: "list", idrecord: "302148" });
  const html2 = await r2.text();
  
  const checks2 = [
    ["MARIA GARCIA (consignee)", html2.includes("MARIA GARCIA")],
    ["JUAN PEREZ (shipper)", html2.includes("JUAN PEREZ")],
    ["ROPA Y CALZADO (goods)", html2.includes("ROPA Y CALZADO")],
    ["ENVIO (clasification)", html2.includes("ENVIO")],
  ];
  
  console.log("Verificación:");
  checks2.forEach(([label, ok]) => console.log(`  ${ok ? "✅" : "❌"} ${label}`));
}

main().catch(console.error);
