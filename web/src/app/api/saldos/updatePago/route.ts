import { NextResponse } from 'next/server';

export async function POST(request) {
    const body = await request.json();
    try {
        const token = request.cookies.get('token')?.value;
        //console.log(body.periodo)
        if (!token){
            return NextResponse.json({ success: false }, { status: 401 });
        }
        const {periodo, value} = body;
        const res = await fetch(`${process.env.API_URL}/api/saldos/updateSaldoPg`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'appToken': process.env.APP_TOKEN,
            },
            body: JSON.stringify({ periodo, value }),
            cache: 'no-store',
        });

        if(!res.ok) return NextResponse.json({ success: false }, { status: 401 });

        return NextResponse.json({ success: true }, { status: 200 });

    }catch(error){
        console.error('Erro ao buscar dados: ', error);
         return NextResponse.json({ success: false }, { status: 500 });
    }
}