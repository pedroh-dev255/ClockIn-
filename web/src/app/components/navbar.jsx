"use client"

import Image from "next/image";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from "react-hot-toast";

export default function Navbar() {
    const router = useRouter();
    async function handleLogout() {
        try {
        // Chama a rota API de logout
        await fetch('/api/logout', { method: 'POST' });
        router.replace('/login'); // Redireciona pro login
        } catch (err) {
        console.error('Erro ao fazer logout:', err);
        }
    }
    return (
        <nav className="bg-gray shadow-md mb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Image src="/logo.png" alt="ClockIn Logo" width={40} height={40} />
                    </div>
                    
                    <div className="flex items-center">
                        <a className="px-4 text-blue-500 hover:text-purple-600 py-2 transition mr-8" href="/">Inicio</a>
                        <a className="px-4 text-blue-500 hover:text-purple-600 py-2 transition mr-8" href="/feriados">Feriados</a>
                        <a className="px-4 text-blue-500 hover:text-purple-600 py-2 transition mr-8" href="/saldos">Saldos</a>
                        <a className="px-4 text-blue-500 hover:text-purple-600 py-2 transition mr-8" href="/configs">Configurações</a>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}