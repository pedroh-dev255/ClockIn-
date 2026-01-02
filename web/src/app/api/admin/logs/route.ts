// app/api/admin/logs/route.js
import { NextResponse } from 'next/server';
import { proxy } from "../../_proxy";

export async function GET(req) {

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") || "unknown";

  try {
    const token = req.cookies.get('token')?.value;

    if (!token){
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const queryString = searchParams.toString(); // ex: "page=2&limit=20&type=error"

    // 2️⃣ REPASSAR PARA O BACKEND
    const url = `${process.env.API_URL}/api/logs${queryString ? `?${queryString}` : ''}`;

    const dados = await proxy(req, url, {
      method: 'GET',
      headers: {
        'appToken': process.env.APP_TOKEN,
        'Authorization': `Bearer ${token}`,
        "x-client-ip": ip
      },
    }).then(res => res.json());

    return NextResponse.json(dados);
  } catch (err) {
    console.error('Erro no GET /api/logs:', err);
    return NextResponse.json({ error: 'Erro ao buscar registros' }, { status: 500 });
  }
}

