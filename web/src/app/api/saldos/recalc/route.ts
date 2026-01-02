import { NextResponse } from 'next/server';

export async function POST(request) {

    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") || "unknown";

    const body = await request.json();
    try {
        const token = request.cookies.get('token')?.value;
        //console.log(body.periodo)
        if (!token){
            return NextResponse.json({ success: false }, { status: 401 });
        }
        const periodo = body.periodo;
        const res = await fetch(`${process.env.API_URL}/api/saldos/setSaldo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'appToken': process.env.APP_TOKEN,
                "x-client-ip": ip
            },
            body: JSON.stringify({ periodo }),
            cache: 'no-store',
        });

        return NextResponse.json({ success: true }, { status: 200 });

    }catch(error){
        console.error('Erro ao buscar dados: ', error);
         return NextResponse.json({ success: false }, { status: 500 });
    }
}