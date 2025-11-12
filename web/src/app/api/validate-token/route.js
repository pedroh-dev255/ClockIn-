// app/api/validate-token/route.js (App Router)
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token){
      return NextResponse.json({ success: false }, { status: 401 });
    }

    // chamar sua API real ou validação local aqui
    // por exemplo:
    const res = await fetch(`${process.env.API_URL}/api/validate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'appToken': process.env.APP_TOKEN,
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
