// app/api/registros/route.js
import { NextResponse } from 'next/server';
import { proxy } from "../../_proxy";

export async function POST(req) {

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") || "unknown";


  try {
    const token = req.cookies.get('token')?.value;

    if (!token){
      return NextResponse.json({ success: false }, { status: 401 });
    }
    const body = await req.json();
    const { periodo } = body;

    let periodoFinal = null

    if(periodo){
        var {mes, ano} = periodo
        periodoFinal = `${mes}/${ano}`
    }

    

    //console.log('Período recebido:', periodoFinal);

    const dados = await proxy(req, `${process.env.API_URL}/api/registers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'appToken': process.env.APP_TOKEN,
        'Authorization': `Bearer ${token}`,
        "x-client-ip": ip
      },
      body: JSON.stringify({ periodo: periodoFinal }),
    }).then(res => res.json());

    return NextResponse.json(dados);
  } catch (err) {
    console.error('Erro no POST /api/registros:', err);
    return NextResponse.json({ error: 'Erro ao buscar registros' }, { status: 500 });
  }
}

