'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from "next/navigation";
import toast from 'react-hot-toast';


export default function ResetPassPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');

    
    useEffect(() => {
        const t = searchParams.get("token");

        if (!t) {
            toast.error('Token de redefinição não encontrado!')
            router.push("/login");
            return;
        }

        setToken(t);
    }, [searchParams, router]);


    async function handleSubmit(event) {
        event.preventDefault();
        
        if(password !== password2){
            return toast.error("Senhas não conferem!")
        }

        if(password.length <= 7){
            return toast.error("Senha menor que 8 caracteres")
        }

        try {

            const res = await fetch('/api/resetpass/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    token,
                    password
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao salvar nova senha');
            
            router.push('/login');
            return toast.success('Senha redefinida com sucesso!');
        } catch (error) {
            return toast.error(error.message);
        }

    }


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
                <h1 className="text-2xl font-semibold text-center mb-6" style={{color: "#6A3EED"}}>ClockIn!</h1>
                <h2 className='text-2x2 font-semibold text-center mb-6'>Confirmação de Redefinição de Senha</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Nova Senha</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Confirme a Nova Senha</label>
                        <input
                            type="password"
                            required
                            value={password2}
                            onChange={e => setPassword2(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                        Redefinir Senha
                    </button>
                </form>
                <p className="text-center text-sm text-gray-500 mt-4">
                    <a href="/login" className="text-blue-600 hover:underline">
                        Voltar ao Login
                    </a>
                </p>
            </div>
        </div>
    );
}