import { NextResponse } from 'next/server';

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
    const { data, coluna, value } = body;

    if(!data || !coluna){
        return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 });;
    }

    const dados = await fetch(`${process.env.API_URL}/api/registers/cad`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'appToken': process.env.APP_TOKEN,
        'Authorization': `Bearer ${token}`,
        "x-client-ip": ip
      },
      body: JSON.stringify({ data, coluna, value }),
    }).then(res => res.json());

    return NextResponse.json(dados);
  } catch (err) {
    console.error('Erro no POST /api/registros:', err);
    return NextResponse.json({ error: 'Erro ao atualizar registro' }, { status: 500 });
  }
}