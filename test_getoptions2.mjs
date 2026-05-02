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
  
  // Try getting options via getOptionsSql
  const fields = ["idfbcnumber", "idfbcguide"];
  for (const field of fields) {
    const r = await fetch(API, {
      method: "POST", headers: h,
      body: new URLSearchParams({ funcname: "getOptionsSql", fldsql: field, kind: "i", identerprise: "55", value: "" }).toString()
    });
    const html = await r.text();
    console.log(`${field}: ${html.substring(0, 500)}`);
    console.log();
  }
  
  // Also try getListRecord for fbcnumber
  const r = await fetch(API, {
    method: "POST", headers: h,
    body: new URLSearchParams({ funcname: "getListRecord", option: "fbcnumber", kind: "list", idrecord: "-1", where: "identerprise=55", orderby: "", offset: "-1", onlytable: "1" }).toString()
  });
  const html2 = await r.text();
  console.log("fbcnumber list (first 1000):", html2.substring(0, 1000));
}
main().catch(console.error);
