"use client"

import Image from "next/image";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './components/navbar'
import toast from "react-hot-toast";
import { isAbsolute } from "path";

export default function Home() {
  const router = useRouter();
  const [mes, setMes] = useState('');
  const [ano, setAno] = useState('');
  const [loading, setLoading] = useState(true)
  const [tpGeral, setTpGeral] = useState('');
  const [diasT, setDiasT] = useState('');
  const [saldoAnt, setSaldoAnt] = useState('');
  const [registros, setRegistros] = useState([]);
  const [editCell, setEditCell] = useState({ data: null, field: null });
  const [editValue, setEditValue] = useState('');
  const [feriados, setFeriados] = useState([]);


  async function fetchPeriodo() {
    try {
      // 🔹 1. Busca o dia de fechamento da configuração
      const response = await fetch(`/api/configs/fechamento_mes`);
      const fechamentoConfig = await response.json();
      const diaFechamento = Number(fechamentoConfig.data);

      const res = await fetch(`/api/configs/toleranciaGeral`);
      const toleranciaGeral = await res.json();

      setTpGeral(Number(toleranciaGeral.data));

      if(isNaN(diaFechamento) || diaFechamento < 1 || diaFechamento > 28) {
        toast.error("Dia de fechamento inválido nas configurações");
        throw new Error("Dia de fechamento inválido");
      }

      //console.log("Dia de fechamento:", diaFechamento);

      // 🔹 2. Calcula o período conforme backend
      const hoje = new Date();
      const diaAtual = hoje.getDate();

      const inicio = new Date(hoje);
      const fim = new Date(hoje);

      if (diaAtual > diaFechamento) {
        // Fechamento já passou → próximo ciclo
        inicio.setDate(diaFechamento + 1);
        fim.setMonth(fim.getMonth() + 1);
        fim.setDate(diaFechamento);
      } else {
        // Ainda dentro do ciclo anterior
        inicio.setMonth(inicio.getMonth() - 1);
        inicio.setDate(diaFechamento + 1);
        fim.setDate(diaFechamento);
      }

      // 🔹 3. Define o mês/ano com base no fim do ciclo (igual backend)
      const mesRef = String(fim.getMonth() + 1).padStart(2, '0');
      const anoRef = fim.getFullYear();

      setMes(mesRef);
      setAno(anoRef);

      await fetchFeriados();
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar período:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFeriados(ano) {
    try {

      const ano_atual = ano || (new Date().getFullYear())

      //console.log("feriados ano: ", ano_atual);
      const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano_atual}`);
      const data = await response.json();

      if (!Array.isArray(data)) throw new Error("Erro ao buscar feriados");

      // Filtro simples: só feriados nacionais (Palmas não tem endpoint específico)
      setFeriados(data.map(f => f.date));
    } catch (error) {
      console.error("Erro ao buscar feriados:", error);
      toast.error("Não foi possível carregar os feriados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPeriodo();
    fetchData();
    
  }, []);




  async function fetchData(periodo) {
    try {
      const res = await fetch('/api/registros', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({periodo}),
      });

      if (!res.ok) {
        throw new Error('Erro ao buscar dados');
      }

      if(periodo){
        await fetchFeriados(periodo.ano);
      }

      const data = await res.json();

      if (data.success && data.data?.registros) {
        setDiasT(data.data.num_dias_mes);
        setSaldoAnt(data.data.saldo_anterior);
        setRegistros(data.data.registros); // ✅ salva registros no estado
      } else {
        setRegistros([]);
        toast.error("Nenhum registro encontrado");
      }

    } catch (err) {
      toast.error('Erro ao buscar dados');
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }

  }

  async function handleFilterSubmit(e) {
    e.preventDefault();

    try {
      const periodo = {
        mes,
        ano
      };

      await fetchData(periodo);
      toast.success('Filtro aplicado!');
    } catch (error) {
      console.error("Erro ao aplicar filtro:", error);
      toast.error("Erro ao aplicar filtro");
    } finally {
      setLoading(false);
    }
  }

  function minutosParaHorasSaldo(minutos) {
    // Para o campo "saldo" você quer string vazia quando for 0
    if (!minutos) return "";

    const sinal = minutos < 0 ? "-" : "";
    const total = Math.abs(Math.trunc(minutos)); // garante inteiro
    const horas = Math.floor(total / 60);
    const mins = total % 60;

    return `${sinal}${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  }

  function minutosParaHoras(minutos) {
    // Se quiser sempre mostrar algo (ex: "00:00" quando 0)
    const sinal = minutos < 0 ? "-" : "";
    const total = Math.abs(Math.trunc(minutos));
    const horas = Math.floor(total / 60);
    const mins = total % 60;

    return `${sinal}${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  }

  function handleDoubleClick(data, field, valorAtual) {
    setEditCell({ data, field });
    setEditValue(valorAtual || '');
  }

  async function handleEditKeyDown(e, data, field) {
    if (e.key === 'Enter') {
      try {
        const body = { data, coluna: field, value: editValue };

        //console.log(body);

        const res = await fetch('/api/registros/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          credentials: 'include',
        });

        if (!res.ok) throw new Error('Erro ao atualizar registro');

        //console.log(res);

        toast.success('Registro atualizado!');
        setEditCell({ data: null, field: null });
        await fetchData({ mes, ano }); // Atualiza tabela
      } catch (err) {
        toast.error(err.message);
        console.error(err);
      }
    }
  }

  function isDiaFeriado(data) {
    if (!feriados || feriados.length === 0) return false;
    const dataFormatada = new Date(data).toISOString().split('T')[0];

    return feriados.includes(dataFormatada);
  }

  async function handleAltMode(data, mode) {

    try {
        const body = { data, coluna: "mode", value: mode };

        //console.log(body);

        const res = await fetch('/api/registros/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          credentials: 'include',
        });

        if (!res.ok) throw new Error('Erro ao atualizar registro');

        //console.log(res);

        toast.success('Registro atualizado!');
        setEditCell({ data: null, field: null });
        await fetchData({ mes, ano }); // Atualiza tabela
      } catch (err) {
        toast.error(err.message);
        console.error(err);
      }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar/>
        <div className="flex justify-center items-center h-screen">
          <svg
            className="animate-spin h-10 w-10 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0
               c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar/>

      {/* Conteúdo principal */}
      <main className="flex-grow bg-gray-100 py-6 px-6 overflow-auto">
        <div className="w-full bg-white rounded-2xl shadow-md p-6">
          
          {/* Filtro */}
          <form
            onSubmit={handleFilterSubmit}
            className="flex flex-wrap items-center gap-4 mb-8"
          >
            <div className="flex items-center gap-2">
              <label htmlFor="mes" className="font-medium">Mês:</label>
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg"
              >
                <option value="01">Janeiro</option>
                <option value="02">Fevereiro</option>
                <option value="03">Março</option>
                <option value="04">Abril</option>
                <option value="05">Maio</option>
                <option value="06">Junho</option>
                <option value="07">Julho</option>
                <option value="08">Agosto</option>
                <option value="09">Setembro</option>
                <option value="10">Outubro</option>
                <option value="11">Novembro</option>
                <option value="12">Dezembro</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="ano" className="font-medium">Ano:</label>
              <select
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg"
              >
                {Array.from(
                  { length: new Date().getFullYear() + 2 - 2000 + 1 },
                  (_, i) => {
                    const year = 2000 + i;
                    return (
                      <option value={year} key={year}>
                        {year}
                      </option>
                    );
                  }
                )}
              </select>
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Filtrar
            </button>
          </form>

          <h2 className="text-lg font-semibold mb-2">
            Registros de Ponto — {mes}/{ano}
          </h2>
          <p className="text-gray-700 mb-6">
            Dias trabalhados: <b>{diasT}</b> — Saldo anterior: <b>{minutosParaHorasSaldo(saldoAnt) || "Não definido"}</b> <a style={{fontSize: "10px", textAlign: "center", color: "#2e31ffff"}} href="/saldos">(Ajuste de saldo aqui)</a>
          </p>

          {/* Tabela */}
          <div className="overflow-x-auto rounded-2xl shadow-lg border border-gray-200">
            <table className="min-w-full text-sm text-center border-separate border-spacing-0">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-500 text-white sticky top-0 shadow-md">
                <tr>
                  {[
                    "Data", "Dia", "H1", "H2", "H3", "H4", "H5", "H6",
                    "Trabalhadas", "Nominais", "Faltante", "50%", "100%",
                    "Saldo", "Obs", "Modo"
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 font-semibold border-r border-blue-400 last:border-r-0"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white">
                {registros.length > 0 ? (() => {
                  // 🔹 Calcula totais uma única vez
                  const totais = registros.reduce(
                    (acc, item) => {
                      acc.horas_trabalhadas += item.horas_trabalhadas || 0;
                      acc.horas_nominais += item.horas_nominais || 0;
                      acc.saldo_negativo += item.saldo_minutos < 0 ? item.saldo_minutos : 0;
                      acc.saldo_50 += item.saldo_minutos > 0 ? item.saldo_minutos : 0;
                      acc.saldo_100 += item.saldo_100 || 0;
                      acc.saldo_total = item.saldo_periodo || 0;
                      return acc;
                    },
                    {
                      horas_trabalhadas: 0,
                      horas_nominais: 0,
                      saldo_negativo: 0,
                      saldo_50: 0,
                      saldo_100: 0,
                      saldo_total: 0,
                    }
                  );

                  // 🔹 Renderiza linhas de registros
                  return (
                    <>
                      {registros.map((item, i) => {
                        const r = item.registros || {};
                        const isToday = item.data === new Date().toISOString().split('T')[0];
                        const isSunday = item.diaSemana === 'Domingo';

                        return (
                          <tr
                            key={item.data || i}
                            className={`
                              transition-all duration-200
                              ${isToday ? 'bg-blue-50 hover:bg-blue-100' :
                                isSunday ? 'bg-red-50 hover:bg-red-100' :
                                i % 2 === 0 ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-50'}
                            `}
                          >
                            <td className="px-0 py-3 font-medium text-gray-800 border-b border-gray-200 border-r">
                              {item.data.split("-").reverse().join("/")}{isDiaFeriado(item.data) && <a href="/feriados"><br /><b className="px-4 py-2 text-red-900" >(Feriado)</b></a>}
                            </td>
                            <td className="px-0 py-3 text-gray-700 border-b border-gray-200 border-r">
                              {item.diaSemana}
                            </td>

                            {/* Campos editáveis */}
                            {["hora1", "hora2", "hora3", "hora4", "hora5", "hora6"].map((field) => (
                              <td
                                key={field}
                                className="px-3 py-2 cursor-pointer text-gray-700 border-b border-gray-200 border-r"
                                onDoubleClick={() => handleDoubleClick(item.data, field, r[field])}
                              >
                                {editCell.data === item.data && editCell.field === field ? (
                                  <input
                                    type="time"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={(e) => handleEditKeyDown(e, item.data, field)}
                                    onBlur={() => handleEditKeyDown({ key: 'Enter' }, item.data, field)}
                                    className="border border-gray-300 rounded-md px-2 py-1 w-20 text-center outline-none focus:ring-2 focus:ring-blue-400"
                                    autoFocus
                                  />
                                ) : (
                                  r[field] || ''
                                )}
                              </td>
                            ))}

                            {/* Colunas calculadas */}
                            <td className="px-1 py-2 text-gray-800 font-medium border-b border-gray-200 border-r">
                              {minutosParaHoras(item.horas_trabalhadas)}
                              {Math.abs(Number(item.horas_trabalhadas) - Number(item.horas_nominais)) < Number(tpGeral) &&
                                Number(item.horas_trabalhadas) !== Number(item.horas_nominais) && (
                                  <span 
                                    title={`Tolerância de ${tpGeral} minutos para mais ou para menos`}
                                    className="cursor-help text-red-500 font-bold ml-1"
                                  >
                                    *
                                  </span>
                              )}
                            </td>
                            <td className="px-1 py-2 text-gray-800 font-medium border-b border-gray-200 border-r">
                              {minutosParaHoras(item.horas_nominais)}
                            </td>
                            <td className="px-1 py-2 text-red-600 font-semibold border-b border-gray-200 border-r">
                              {minutosParaHorasSaldo(item.saldo_minutos < 0 ? item.saldo_minutos : 0)}
                            </td>
                            <td className="px-1 py-2 text-green-600 font-semibold border-b border-gray-200 border-r">
                              {minutosParaHorasSaldo(item.saldo_minutos > 0 ? item.saldo_minutos : 0)}
                            </td>
                            <td className="px-1 py-2 text-yellow-600 font-semibold border-b border-gray-200 border-r">
                              {minutosParaHorasSaldo(item.saldo_100)}
                            </td>
                            <td className="px-1 py-2 text-blue-700 font-semibold border-b border-gray-200 border-r">
                              {minutosParaHoras(item.saldo_periodo)}
                            </td>

                            {/* Observação */}
                            <td
                              className="px-4 py-2 cursor-pointer text-gray-700 border-b border-gray-200 border-r"
                              onDoubleClick={() => handleDoubleClick(item.data, 'obs', r.obs)}
                            >
                              {editCell.data === item.data && editCell.field === 'obs' ? (
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => handleEditKeyDown(e, item.data, 'obs')}
                                  onBlur={() => handleEditKeyDown({ key: 'Enter' }, item.data, 'obs')}
                                  className="border border-gray-300 rounded-md px-2 py-1 w-full text-center outline-none focus:ring-2 focus:ring-blue-400"
                                  autoFocus
                                />
                              ) : (
                                r.obs || ''
                              )}
                            </td>

                            {/* Modo */}
                            <td className="px-4 py-2 border-b border-gray-200">
                              <select
                                onChange={(e) => handleAltMode(item.data, e.target.value)}
                                value={r.mode || ""}
                                className="border border-gray-300 rounded-md px-2 py-1 text-gray-700 outline-none focus:ring-2 focus:ring-blue-400"
                              >
                                <option value="">-</option>
                                <option value="ferias">Férias</option>
                                <option value="folga">Folga</option>
                                <option value="feriado">Feriado</option>
                                <option value="feriado manha">Feriado Manhã</option>
                                <option value="feriado tarde">Feriado Tarde</option>
                                <option value="bonificado">Bonificada</option>
                                <option value="atestado">Atestado</option>
                                <option value="atestado manha">Atestado Manhã</option>
                                <option value="atestado tarde">Atestado Tarde</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}

                      {/* 🔹 Linha de totais */}
                      <tr className="bg-blue-50 font-semibold text-gray-800 border-t border-gray-300 shadow-inner">
                        <td className="px-1 py-3 text-center border-r border-gray-200" colSpan="8">
                          Totais
                        </td>
                        <td className="px-1 py-3 border-r border-gray-200">
                          {minutosParaHorasSaldo(totais.horas_trabalhadas)}
                        </td>
                        <td className="px-1 py-3 border-r border-gray-200">
                          {minutosParaHorasSaldo(totais.horas_nominais)}
                        </td>
                        <td className="px-1 py-3 text-red-600 font-semibold border-r border-gray-200">
                          {minutosParaHorasSaldo(totais.saldo_negativo)}
                        </td>
                        <td className="px-1 py-3 text-green-600 font-semibold border-r border-gray-200">
                          {minutosParaHorasSaldo(totais.saldo_50)}
                        </td>
                        <td className="px-1 py-3 text-yellow-600 font-semibold border-r border-gray-200">
                          {minutosParaHorasSaldo(totais.saldo_100)}
                        </td>
                        <td className="px-1 py-3 text-blue-700 font-semibold border-r border-gray-200">
                          {minutosParaHorasSaldo(totais.saldo_total)}
                        </td>
                        <td colSpan="2" className="border-r border-gray-200"></td>
                      </tr>
                    </>
                  );
                })() : (
                  <tr>
                    <td colSpan="16" className="text-center py-6 text-gray-500">
                      Nenhum registro encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>


        </div>
      </main>
    </div>

  );
}
