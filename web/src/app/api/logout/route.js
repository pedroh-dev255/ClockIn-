import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logout realizado com sucesso' });
  response.cookies.set('token', '', {
    httpOnly: true,
    expires: new Date(0), // expira o cookie imediatamente
    path: '/',
  });
  return response;
}
