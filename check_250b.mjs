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

  const r = await post("getListRecord", {
    option: "reservef",
    where: "r.idreserve > 302248",
    offset: "0", numrows: "5", onlytable: "1",
  });
  const html = await r.text();
  // Find the actual data row
  const trMatch = html.match(/<tr id="id_tr_reservef_(\d+)">([\s\S]*?)<\/tr>/);
  if (trMatch) {
    console.log("Found row with ID:", trMatch[1]);
    console.log("Row content:");
    // Extract td values
    const tds = trMatch[2].match(/<td[^>]*title="([^"]*)"[^>]*>([^<]*)<\/td>/g) || [];
    tds.forEach(td => {
      const title = (td.match(/title="([^"]*)"/) || [])[1];
      if (title && title !== "_tdcontentt_") {
        const id = (td.match(/id="id_td_(\w+)_[^"]*"/) || [])[1];
        console.log(`  ${id} = ${title}`);
      }
    });
  } else {
    console.log("No data row found. Raw HTML:");
    console.log(html.substring(html.indexOf("<tr"), html.indexOf("<tr") + 2000));
  }
}

main().catch(console.error);
