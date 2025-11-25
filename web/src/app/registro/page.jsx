'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { EyeIcon, EyeOffIcon } from 'lucide-react';


export default function RegistroPage() {
    const router = useRouter();
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
    
    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setErro('');

        if (senha !== confirmarSenha) {
            toast.error('As senhas não coincidem');
            setLoading(false);
            return;
        }

        if(senha.length <=7 ){
            toast.error('As senhas menor que 8 caracteres');
            setLoading(false);
            return;
        }

        
        try {

            const res = await fetch('/api/registro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    nome,
                    email,
                    senha
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar usuario');
            
            router.push('/');
            return toast.success('Usuario cadastrado com sucesso!');
        } catch (error) {
            return toast.error(error.message);
        }

        
    }


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
                <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
                    <h1 className="text-2xl font-semibold text-center mb-6" style={{color: "#6A3EED"}}>ClockIn!</h1>
                    <h2 className='text-2x2 font-semibold text-center mb-6'>Cadastro de Usuario</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Nome</label>
                            <input
                                type="text"
                                required
                                value={nome}
                                onChange={e => setNome(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">E-mail</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Senha</label>
                            <input
                                type={mostrarSenha ? 'text' : 'password'}
                                minLength={6}
                                required
                                value={senha}
                                onChange={e => setSenha(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarSenha(!mostrarSenha)}
                                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                            >
                                {mostrarSenha ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                            </button>
                        </div>

                        {/* Campo Confirmar Senha */}
                        <div className="relative mt-3">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Confirmar senha</label>
                            <input
                                type={mostrarConfirmar ? 'text' : 'password'}
                                minLength={6}
                                required
                                value={confirmarSenha}
                                onChange={e => setConfirmarSenha(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                            >
                                {mostrarConfirmar ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                            </button>
                        </div>

                        {erro && <p className="text-red-500 text-sm text-center">{erro}</p>}

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                        >
                            {loading ? 'Cadastrando...' : 'Cadastrar'}
                        </button>
                    </form>
                    <p className="text-center text-sm text-gray-500 mt-4">
                        <a href="/login" className="text-blue-600 hover:underline">
                            Já tenho conta
                        </a>
                    </p>
                </div>
        </div>
    );

}