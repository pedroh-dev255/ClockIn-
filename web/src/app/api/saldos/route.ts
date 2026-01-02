import { NextResponse } from 'next/server';

export async function POST(request) {

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") || "unknown";

  try {
    const token = request.cookies.get('token')?.value;

    if (!token){
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const { ano } = await request.json();

    const res = await fetch(`${process.env.API_URL}/api/saldos/getSaldos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'appToken': process.env.APP_TOKEN,
        "x-client-ip": ip
      },
      body: JSON.stringify({ ano }),
      cache: 'no-store',
    });
    //console.log(res)
    if (!res.ok) return NextResponse.json({ success: false }, { status: 400 });

    const json = await res.json();

    return NextResponse.json({data: json.saldos }, { status: 200 });
  } catch (err) {
    console.error('Erro ao buscar dados: ', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
