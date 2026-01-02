import { NextResponse } from 'next/server';

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
    const res = await fetch(`${process.env.API_URL}/api/configs/fechamento_mes`, {
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
    //console.log('Resposta da API de fechamento do mês: ', json);
    return NextResponse.json({data: json.data }, { status: 200 });
  } catch (err) {
    console.error('Erro ao buscar dados: ', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
