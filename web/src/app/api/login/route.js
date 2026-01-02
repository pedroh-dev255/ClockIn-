// app/api/login/route.js
import { NextResponse } from 'next/server';
import { getClientIp } from '../lib/getClientIP';

export async function POST(request) {
  const ip = getClientIp(request);

  console.log({
    forwarded: request.headers.get("x-forwarded-for"),
    real: request.headers.get("x-real-ip"),
    ip
  });

  try {
    //console.log('Recebendo requisição de login');
    const body = await request.json();
    const { email, senha } = body;

    const res = await fetch(`${process.env.API_URL}/api/users/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'appToken': process.env.APP_TOKEN,
            "x-client-ip": ip
        },
        body: JSON.stringify({ email, password: senha }),
    });

    //console.log('Resposta da API de login:', res.status);

    const data = await res.json();

    //console.log('Dados da API de login:', data);


    if (!res.ok || !data.result.token) {
      return NextResponse.json({ success: false, message: data.message || 'Credenciais inválidas' }, { status: 401 });
    }

    // cria resposta e define cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('token', data.result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 dia
    });

    return response;
  } catch (err) {
    console.error('Erro no login:', err);
    return NextResponse.json({ success: false, message: 'Erro ao conectar ao servidor' }, { status: 500 });
  }
}
