// app/api/validate-token/route.js (App Router)
import { NextResponse } from 'next/server';
import { proxy } from "../_proxy";

export async function GET(request) {

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") || "unknown";

  try {
    const token = request.cookies.get('token')?.value;

    if (!token){
      return NextResponse.json({ success: false }, { status: 401 });
    }

    // chamar sua API real ou validação local aqui
    // por exemplo:
    const res = await proxy(request, `${process.env.API_URL}/api/validate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'appToken': process.env.APP_TOKEN,
        "x-client-ip": ip
      },
      cache: 'no-store',
    });

    if (!res.ok) return NextResponse.json({ success: false }, { status: 401 });

    const json = await res.json();
    return NextResponse.json({ success: !!json.success });
  } catch (err) {
    console.error('API validate-token error', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
