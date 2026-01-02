import { NextResponse } from 'next/server';
import { proxy } from "../../_proxy";

export async function POST(request) {

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") || "unknown";

  
  try {
    const body = await request.json();

    var {password, token} = body

    const res = await proxy(request, `${process.env.API_URL}/api/users/confirmReset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'appToken': process.env.APP_TOKEN,
        "x-client-ip": ip
      },
      body: JSON.stringify({ token, password }),
      cache: 'no-store',
    });
    //console.log(res);
    if (!res.ok) return NextResponse.json({ success: false }, { status: 401 });

    const json = await res.json();

    return NextResponse.json({success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
