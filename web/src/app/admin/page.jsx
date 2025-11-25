"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import Logs from "./screens/logs";

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        level: "",
        context: "",
        start: "",
        end: "",
        search: "",
        page: 1,
    });

    async function fetchLogs() {
        setLoading(true);

        const params = new URLSearchParams(filters);

        const token = document.cookie
            .split("; ")
            .find((r) => r.startsWith("token="))
            ?.split("=")[1];

        const res = await fetch(`/api/admin/logs?${params.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        const data = await res.json();

        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setLoading(false);
    }

    useEffect(() => {
        if (activeTab === "logs") fetchLogs();
    }, [filters, activeTab]);

    function handleFilterChange(e) {
        setFilters({ ...filters, [e.target.name]: e.target.value, page: 1 });
    }

    const menu = [
        { key: "dashboard", label: "Dashboard" },
        { key: "logs", label: "Logs do Sistema" },
        { key: "users", label: "Gerenciar Usuários" },
        { key: "saldos", label: "Saldos Manuais" },
        { key: "configs", label: "Configurações" },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />

            <div className="flex flex-1">
                {/* SIDEBAR */}
                <aside className="w-64 bg-white border-r shadow-sm p-4 flex flex-col">
                    <h2 className="text-xl font-bold mb-4">Admin Menu</h2>

                    {menu.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => setActiveTab(item.key)}
                            className={`text-left px-3 py-2 rounded-lg mb-2 transition
                                ${
                                    activeTab === item.key
                                        ? "bg-blue-600 text-white"
                                        : "hover:bg-gray-200 text-gray-700"
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </aside>

                {/* CONTEÚDO */}
                <main className="flex-1 p-6">
                    {activeTab === "dashboard"}
                    {activeTab === "logs" && (
                        <Logs
                            logs={logs}
                            total={total}
                            loading={loading}
                            filters={filters}
                            setFilters={setFilters}
                            handleInput={handleFilterChange}
                        />
                    )}
                    {activeTab === "users" }
                    {activeTab === "saldos" }
                    {activeTab === "configs"}
                </main>
            </div>
        </div>
    );
}
