'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Usuário ou senha inválidos');
        setErro(data.message || 'Usuário ou senha inválidos');
        setLoading(false);
        return;
      }
      toast.success('Login realizado com sucesso!');
      router.push('/'); // redireciona pro dashboard
    } catch (err) {
      console.error(err);
      toast.error('Erro ao conectar com o servidor');
      setErro('Erro ao conectar com o servidor');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-2xl font-semibold text-center mb-6" style={{color: "#6A3EED"}}>ClockIn!</h1>
          <h2 className='text-2x2 font-semibold text-center mb-6'>Acesso ao Sistema</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
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

            {erro && <p className="text-red-500 text-sm text-center">{erro}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Esqueceu a senha?{' '}
            <a href="/redefinir-senha" className="text-blue-600 hover:underline">
              Redefinir
            </a>
          </p>

          <p className="text-center text-sm text-gray-500 mt-4">
            <a href="/registro" className="text-blue-600 hover:underline">
              Não tem uma conta? Cadastre-se aqui.
            </a>
          </p>
        </div>
    </div>
  );
}
