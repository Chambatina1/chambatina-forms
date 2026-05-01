import { NextResponse } from "next/server";
import { login, checkSession } from "@/lib/solvedcargo";

const API_PATH = "https://www.solvedc.com/cargo/cargopack/v1/php/solved/routing.php";

// GET /api/debug/sync - Prueba completa de SolvedCargo sin tocar BD
export async function GET() {
  const logs: string[] = [];
  
  try {
    // 1. Login
    logs.push("--- PASO 1: LOGIN ---");
    const response = await fetch(API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        funcname: "loginUser",
        user: "GEO MIA",
        password: "GEO**091223",
      }).toString(),
      redirect: "manual",
    });
    
    logs.push(`Login status: ${response.status}`);
    
    const setCookie = response.headers.get("set-cookie") || "";
    const match = setCookie.match(/PHPSESSID=([^;]+)/);
    if (!match) {
      logs.push("ERROR: No se obtuvo PHPSESSID");
      return NextResponse.json({ success: false, logs });
    }
    const phpsessid = match[1];
    logs.push(`PHPSESSID: ${phpsessid}`);
    
    const loginData = await response.json();
    logs.push(`Login data: ${JSON.stringify(loginData)}`);
    const identerprise = loginData.identerprise;
    
    // 2. Check session
    logs.push("--- PASO 2: CHECK SESSION ---");
    const checkRes = await fetch(API_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: `PHPSESSID=${phpsessid}`,
      },
      body: new URLSearchParams({
        funcname: "checkIfValidSession",
        username: "GEO MIA",
        password: "GEO**091223",
      }).toString(),
    });
    const checkText = (await checkRes.text()).trim();
    logs.push(`Session valid: ${checkText}`);
    
    if (checkText !== "1") {
      logs.push("ERROR: Sesion no valida");
      return NextResponse.json({ success: false, logs });
    }
    
    // 3. Insert shipper
    logs.push("--- PASO 3: INSERT SHIPPER ---");
    const shipperParams = `;CHAMBATINA+MIAMI;MIAMI+FL+USA;;;7865550000;;USA;test@test.com;;${identerprise}`;
    logs.push(`Shipper params: ${shipperParams}`);
    
    const shipperBody = new URLSearchParams({
      funcname: "insertRecord",
      option: "shipper",
      params: shipperParams,
    }).toString();
    logs.push(`Shipper body: ${shipperBody.substring(0, 200)}`);
    
    const shipperRes = await fetch(API_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: `PHPSESSID=${phpsessid}`,
      },
      body: shipperBody,
    });
    logs.push(`Shipper status: ${shipperRes.status}`);
    const shipperId = (await shipperRes.text()).trim();
    logs.push(`Shipper ID: ${shipperId}`);
    
    if (!shipperId || shipperId === "0" || isNaN(Number(shipperId))) {
      logs.push("ERROR: Shipper no se creo correctamente");
      return NextResponse.json({ success: false, logs });
    }
    
    // 4. Insert consignee
    logs.push("--- PASO 4: INSERT CONSIGNEE ---");
    const consigneeParams = `;MARIA;GARCIA;RODRIGUEZ;;89070834296;55551234;;;CALLE+5;;;;;${identerprise}`;
    logs.push(`Consignee params: ${consigneeParams}`);
    
    const consigneeBody = new URLSearchParams({
      funcname: "insertRecord",
      option: "consignee",
      params: consigneeParams,
    }).toString();
    
    const consigneeRes = await fetch(API_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: `PHPSESSID=${phpsessid}`,
      },
      body: consigneeBody,
    });
    logs.push(`Consignee status: ${consigneeRes.status}`);
    const consigneeId = (await consigneeRes.text()).trim();
    logs.push(`Consignee ID: ${consigneeId}`);
    
    if (!consigneeId || consigneeId === "0" || isNaN(Number(consigneeId))) {
      logs.push("ERROR: Consignee no se creo correctamente");
      return NextResponse.json({ success: false, logs });
    }
    
    // 5. Insert reserve
    logs.push("--- PASO 5: INSERT RESERVE ---");
    const today = new Date().toISOString().split("T")[0];
    const reserveParams = [
      "", identerprise, "101", "", "", "", "", "", "", "", "",
      "ROPA+Y+CALZADO", "", today, "",
      consigneeId, "", "89070834296", "CALLE+5", "55551234",
      shipperId, "", "", "0", "", "", "",
      "0", "0", "1", "5.0", "0", "0",
      "4", "", "", "0", "0", "", "", ""
    ].join(";");
    logs.push(`Reserve params length: ${reserveParams.length}`);
    
    const reserveBody = new URLSearchParams({
      funcname: "insertRecord",
      option: "reservef",
      params: reserveParams,
    }).toString();
    
    const reserveRes = await fetch(API_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: `PHPSESSID=${phpsessid}`,
      },
      body: reserveBody,
    });
    logs.push(`Reserve status: ${reserveRes.status}`);
    const reserveId = (await reserveRes.text()).trim();
    logs.push(`Reserve ID: ${reserveId}`);
    
    const success = !isNaN(Number(reserveId)) && Number(reserveId) > 0;
    
    return NextResponse.json({
      success,
      shipperId,
      consigneeId,
      reserveId,
      logs,
    });
  } catch (error) {
    logs.push(`EXCEPTION: ${error instanceof Error ? error.message + " | " + error.stack : String(error)}`);
    return NextResponse.json({ success: false, logs, error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
