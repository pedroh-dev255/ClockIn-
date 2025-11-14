'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResetPassPage() {

    //receber token da url para validar a redefinição de senha
    const router = useRouter();

    

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
                <h1 className="text-2xl font-semibold text-center mb-6" style={{color: "#6A3EED"}}>ClockIn!</h1>
                <h2 className='text-2x2 font-semibold text-center mb-6'>Confirmação de Redefinição de Senha</h2>
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Nova Senha</label>
                        <input
                            type="password"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Confirme a Nova Senha</label>
                        <input
                            type="password"
                            required
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