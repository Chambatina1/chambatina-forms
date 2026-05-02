const API = "https://www.solvedc.com/cargo/cargopack/v1/php/solved/routing.php";

async function main() {
  const loginResp = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ funcname: "loginUser", user: "GEO MIA", password: "GEO**091223" }).toString(),
    redirect: "manual",
  });
  const phpsessid = loginResp.headers.get("set-cookie")?.match(/PHPSESSID=([^;]+)/)?.[1] || "";
  const cookie = `PHPSESSID=${phpsessid}`;
  const h = { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookie };
  
  const r = await fetch(API, {
    method: "POST", headers: h,
    body: new URLSearchParams({ funcname: "getInsertRow", option: "reservef", kind: "newlist", rowindex: "0" }).toString()
  });
  const html = await r.text();
  
  // Extract fbcnumber options
  const fbcStart = html.indexOf('json-id_input_idfbcnumber');
  if (fbcStart >= 0) {
    const optionsEnd = html.indexOf("</datalist>", fbcStart);
    const segment = html.substring(fbcStart, optionsEnd);
    const opts = segment.match(/value="([^"]+)"[^>]*>([^<]*)/g) || [];
    console.log("idfbcnumber options:");
    opts.forEach(o => {
      const v = o.match(/value="([^"]+)"/)?.[1];
      const l = o.match(/>([^<]*)/)?.[1];
      console.log(`  value=${v} display=${l}`);
    });
  }
  
  // Extract fbcguide options
  const fbgStart = html.indexOf('json-id_input_idfbcguide');
  if (fbgStart >= 0) {
    const optionsEnd = html.indexOf("</datalist>", fbgStart);
    const segment = html.substring(fbgStart, optionsEnd);
    const opts = segment.match(/value="([^"]+)"[^>]*>([^<]*)/g) || [];
    console.log("\nidfbcguide options:");
    opts.forEach(o => {
      const v = o.match(/value="([^"]+)"/)?.[1];
      const l = o.match(/>([^<]*)/)?.[1];
      console.log(`  value=${v} display=${l}`);
    });
  }
}
main().catch(console.error);
