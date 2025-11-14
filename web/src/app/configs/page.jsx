'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../components/navbar';
import { XCircle } from 'lucide-react';

export default function ConfigPage() {
  const [configs, setConfigs] = useState([]);
  const [nominais, setNominais] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchConfigs() {
    try {
      const response = await fetch(`/api/configs/`);
      const dados = await response.json();

      if (!response.ok) throw new Error(dados.error || 'Erro ao carregar configs');

      setConfigs(dados.data.conf);
      setNominais(dados.data.nominal);
    } catch (error) {
      toast.error(error.message || 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }

  async function salvarConfigs() {
    try {
      const response = await fetch(`/api/configs/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conf: configs, nominal: nominais }),
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar configurações');

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    fetchConfigs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto w-full p-6 mt-4 bg-white shadow rounded-2xl">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">⚙️ Configurações do Usuário</h1>

        {/* Configurações Gerais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {configs.map((conf, i) => (
            <div key={conf.id} className="flex flex-col">
              <label className="font-semibold text-gray-700 mb-1 capitalize">
                {conf.config_key}
              </label>
              <input
                type="number"
                className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
                value={conf.config_value}
                onChange={(e) => {
                  const nova = [...configs];
                  nova[i].config_value = e.target.value;
                  setConfigs(nova);
                }}
              />
            </div>
          ))}
        </div>

        {/* Tabela Nominal */}
        <h2 className="text-xl font-semibold mb-4 text-gray-800">🕒 Horários Nominais</h2>
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 text-left">Dia da Semana</th>
                <th className="p-2 text-center">Entrada 1</th>
                <th className="p-2 text-center">Saída 1</th>
                <th className="p-2 text-center">Entrada 2</th>
                <th className="p-2 text-center">Saída 2</th>
                <th className="p-2 text-center">Entrada 3</th>
                <th className="p-2 text-center">Saída 3</th>
              </tr>
            </thead>
            <tbody>
              {nominais.map((n, i) => (
                <tr key={n.id} className="border-t">
                  <td className="p-2 font-semibold text-gray-800">{n.dia_semana}</td>
                  {['hora1', 'hora2', 'hora3', 'hora4', 'hora5', 'hora6'].map((campo) => (
                    <td key={campo} className="p-1 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="time"
                          className="border rounded-lg p-1 text-center w-24"
                          value={n[campo] || ''}
                          onChange={(e) => {
                            const nova = [...nominais];
                            nova[i][campo] = e.target.value;
                            setNominais(nova);
                          }}
                        />
                        <button
                          type="button"
                          title="Limpar horário"
                          className="text-red-500 hover:text-red-700 transition-colors p-0.5"
                          onClick={() => {
                            const nova = [...nominais];
                            nova[i][campo] = null;
                            setNominais(nova);
                          }}
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={salvarConfigs}
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-all"
          >
            💾 Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
