'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/navbar';
import toast from 'react-hot-toast';

export default function FeriadosPage() {
  const [ano, setAno] = useState(new Date().getFullYear());
  const [feriados, setFeriados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalFeriado, setModalFeriado] = useState(null);

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril',
    'Maio', 'Junho', 'Julho', 'Agosto',
    'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  async function buscarFeriados(anoSelecionado = ano) {
    try {
      setLoading(true);
      const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${anoSelecionado}`);
      const data = await response.json();

      if (!Array.isArray(data)) throw new Error('Erro ao buscar feriados');

      // Ajusta a data e cria feriados estaduais e municipais de exemplo
      const feriadosAjustados = data.map(f => ({
        ...f,
        // Ajuste de fuso horário: adiciona 1 dia ao converter UTC → local
        dateObj: new Date(`${f.date}T00:00:00-03:00`),
        type: f.type || 'national'
      }));

      // Simulação de feriados locais (apenas exemplo)
      feriadosAjustados.push({
        name: 'Aniversário de Palmas',
        date: `${anoSelecionado}-05-20`,
        dateObj: new Date(`${anoSelecionado}-05-20T00:00:00-03:00`),
        type: 'municipal',
      });

      feriadosAjustados.push({
        name: 'Dia do Tocantins',
        date: `${anoSelecionado}-10-05`,
        dateObj: new Date(`${anoSelecionado}-10-05T00:00:00-03:00`),
        type: 'state',
      });

      setFeriados(feriadosAjustados);
      toast.success(`Feriados de ${anoSelecionado} carregados!`);
    } catch (error) {
      toast.error('Erro ao buscar feriados.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    buscarFeriados();
  }, []);

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  function getCorPorTipo(tipo) {
    switch (tipo) {
      case 'state': return 'bg-green-600 hover:bg-green-700';
      case 'municipal': return 'bg-orange-500 hover:bg-orange-600';
      default: return 'bg-blue-600 hover:bg-blue-700';
    }
  }

  function getNomeTipo(tipo) {
    switch (tipo) {
      case 'state': return 'Estadual';
      case 'municipal': return 'Municipal';
      default: return 'Nacional';
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto w-full p-6 mt-6 bg-white shadow rounded-2xl">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">📅 Feriados em Palmas - TO</h1>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="flex flex-col">
            <label className="font-semibold text-gray-700 mb-1">Estado</label>
            <select
              className="border rounded-lg p-2 bg-gray-100 cursor-not-allowed text-gray-500"
              disabled
              value="TO"
            >
              <option value="TO">Tocantins</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="font-semibold text-gray-700 mb-1">Cidade</label>
            <select
              className="border rounded-lg p-2 bg-gray-100 cursor-not-allowed text-gray-500"
              disabled
              value="Palmas"
            >
              <option value="Palmas">Palmas</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="font-semibold text-gray-700 mb-1">Ano</label>
            <input
              type="number"
              className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => buscarFeriados(ano)}
              disabled={loading}
              className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 w-full"
            >
              {loading ? 'Carregando...' : '🔍 Buscar'}
            </button>
          </div>
        </div>

        {/* Calendário */}
        {feriados.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {meses.map((mes, idx) => {
              const diasNoMes = new Date(ano, idx + 1, 0).getDate();
              const primeiroDiaSemana = new Date(ano, idx, 1).getDay();

              const feriadosDoMes = feriados.filter(
                (f) => f.dateObj.getMonth() === idx
              );

              return (
                <div key={idx} className="border rounded-xl p-3 shadow-sm">
                  <h2
                    className={`text-lg font-bold mb-3 text-center ${
                      idx === mesAtual && ano === anoAtual
                        ? 'text-blue-700'
                        : 'text-gray-700'
                    }`}
                  >
                    {mes}
                  </h2>
                  <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 mb-1">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                        <div key={`${d}-${i}`}>{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-sm">
                    {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
                      <div key={`vazio-${i}`} />
                    ))}

                    {Array.from({ length: diasNoMes }).map((_, dia) => {
                      const dataAtual = new Date(ano, idx, dia + 1);
                      const feriado = feriadosDoMes.find(
                        (f) => f.dateObj.getDate() === dia + 1
                      );
                      const passou = dataAtual < hoje;
                      const ehHoje = dataAtual.toDateString() === hoje.toDateString();

                      return (
                        <div
                          key={dia}
                          onClick={() => feriado && setModalFeriado(feriado)}
                          className={`p-1 rounded-md border text-center transition-all ${
                            feriado
                              ? `${getCorPorTipo(feriado.type)} text-white font-semibold cursor-pointer`
                              : 'border-gray-200'
                          } ${passou && !ehHoje ? 'opacity-40' : ''} ${
                            ehHoje ? 'ring-2 ring-blue-400' : ''
                          }`}
                          title={feriado ? feriado.name : ''}
                        >
                          {dia + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && feriados.length === 0 && (
          <p className="text-gray-500 text-center mt-10">Nenhum feriado encontrado.</p>
        )}
      </div>

      {/* Modal */}
      {modalFeriado && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <div className="bg-white rounded-2xl p-6 w-80 shadow-lg text-center">
            <h3 className="text-xl font-bold mb-2">{modalFeriado.name}</h3>
            <p className="text-gray-600 mb-2">
              {new Date(modalFeriado.dateObj).toLocaleDateString('pt-BR')}
            </p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-white text-sm font-semibold ${getCorPorTipo(modalFeriado.type)}`}
            >
              {getNomeTipo(modalFeriado.type)}
            </span>
            <div className="mt-5">
              <button
                onClick={() => setModalFeriado(null)}
                className="bg-gray-200 px-4 py-1 rounded-lg hover:bg-gray-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
