import { NextResponse } from 'next/server';
import { proxy } from "../../_proxy";

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
        const saldo = body.saldo;
        const obs = body.obs

        const res = await proxy(request, `${process.env.API_URL}/api/saldos/updateSaldo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'appToken': process.env.APP_TOKEN,
                "x-client-ip": ip
            },
            body: JSON.stringify({ periodo, saldo, obs }),
            cache: 'no-store',
        });

        if(!res.ok) return NextResponse.json({ success: false }, { status: 400 });
 
        return NextResponse.json({ success: true }, { status: 200 });

    }catch(error){
        console.error('Erro ao atualizar dados: ', error);
         return NextResponse.json({ success: false }, { status: 500 });
    }
}