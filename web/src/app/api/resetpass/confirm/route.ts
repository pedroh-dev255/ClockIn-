import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();

    var {password, token} = body

    const res = await fetch(`${process.env.API_URL}/api/users/confirmReset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'appToken': process.env.APP_TOKEN,
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
