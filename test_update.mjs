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
  console.log("Login OK");
  
  // Try updateRecord on existing record 302235
  // Format: idrecord;field1=value1;field2=value2;...
  // Based on the error from earlier: UPDATE table SET col=val WHERE id=id
  // The params are semicolon-separated: idrecord;data
  console.log("\\n1. Testing updateRecord on record 302235...");
  const updateResult = await fetch(API, {
    method: "POST", headers: h,
    body: new URLSearchParams({
      funcname: "updateRecord",
      option: "reservef",
      params: "302235;observation=API UPDATED TEST"
    }).toString()
  });
  const updateText = await updateResult.text();
  console.log("Update result:", updateText.substring(0, 500));
  
  // Now search for the record to verify
  console.log("\n2. Searching for updated record...");
  const r = await fetch(API, {
    method: "POST", headers: h,
    body: new URLSearchParams({
      funcname: "getRecord",
      option: "reservef", kind: "list", idrecord: "-1",
      where: "idreserve=302235", identerprise: "55,0"
    }).toString()
  });
  const html = await r.text();
  console.log("Found:", html.includes("API UPDATED TEST") || html.includes("302235"));
  
  // Also search all to see if record changed
  const r2 = await fetch(API, {
    method: "POST", headers: h,
    body: new URLSearchParams({
      funcname: "getRecord",
      option: "reservef", kind: "list", idrecord: "-1",
      where: "observation like '%TEST%'", identerprise: "55,0"
    }).toString()
  });
  const html2 = await r2.text();
  const rows = (html2.match(/id_tr_reservef_list_/g) || []).length;
  console.log("Search for TEST in observation: " + rows + " rows");
  
  // Get ALL reserves to see if 302235 has changed
  const r3 = await fetch(API, {
    method: "POST", headers: h,
    body: new URLSearchParams({
      funcname: "getRecord",
      option: "reservef", kind: "list", idrecord: "-1",
      where: "", identerprise: "55,0"
    }).toString()
  });
  const html3 = await r3.text();
  const cells = html3.match(/id_td_namegood_reservef_list_\\d+\"[^>]*>([^<]{1,200})/g) || [];
  const goods302235 = cells.filter((c, i) => {
    const idMatch = html3.substring(0, c.index).match(/id_td_idreserve_reservef_list_\\d+\"[^>]*title=\"(\\d+)\"/g);
    return idMatch && idMatch[idMatch.length - 1]?.[1] === "302235";
  });
  console.log("Record 302235 goods:", goods302235.length > 0 ? goods302235[0] : "NOT FOUND");
}
main().catch(console.error);
