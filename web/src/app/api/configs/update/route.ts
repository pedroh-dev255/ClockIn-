import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const { conf, nominal } = await request.json(); // ✅ aqui é o parse correto

    const res = await fetch(`${process.env.API_URL}/api/configs/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'appToken': process.env.APP_TOKEN,
      },
      body: JSON.stringify({ conf, nominal }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Erro da API:', errorText);
      return NextResponse.json({ success: false, error: 'Erro ao salvar configs' }, { status: 500 });
    }

    const json = await res.json();
    //console.log('Resposta da API configs/update:', json);
    return NextResponse.json({ success: true, data: json.data }, { status: 200 });

  } catch (err) {
    console.error('Erro ao salvar configs:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
