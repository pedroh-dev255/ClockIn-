"use client"

import Image from "next/image";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from "react-hot-toast";
import { get } from "http";


export default function Home() {
  const router = useRouter();
  const [mes, setMes] = useState('');
  const [ano, setAno] = useState('');
  const [diasT, setDiasT] = useState('');
  const [saldoAnt, setSaldoAnt] = useState('');
  const [registros, setRegistros] = useState([]);
  const [editCell, setEditCell] = useState({ data: null, field: null });
  const [editValue, setEditValue] = useState('');


  async function fetchPeriodo() {
    try {
      // 🔹 1. Busca o dia de fechamento da configuração
      const response = await fetch(`/api/configs/fechamento_mes`);
      const fechamentoConfig = await response.json();
      const diaFechamento = Number(fechamentoConfig.data);

      if(isNaN(diaFechamento) || diaFechamento < 1 || diaFechamento > 28) {
        toast.error("Dia de fechamento inválido nas configurações");
        throw new Error("Dia de fechamento inválido");
      }

      console.log("Dia de fechamento:", diaFechamento);

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

    } catch (error) {
      console.error("Erro ao buscar período:", error);
    }
  }

  useEffect(() => {
    fetchPeriodo();
    fetchData();
  }, []);


  async function handleLogout() {
    try {
      // Chama a rota API de logout
      await fetch('/api/logout', { method: 'POST' });
      router.replace('/login'); // Redireciona pro login
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  }

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
    }
  }

  function minutosParaHorasSaldo(minutos) {
    if(minutos == 0){
      return ""
    }
    const horas = Math.floor(minutos / 60);
    const mins = Math.abs(minutos % 60);
    return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  function minutosParaHoras(minutos) {
    const horas = Math.floor(minutos / 60);
    const mins = Math.abs(minutos % 60);
    return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
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

        console.log(res);

        toast.success('Registro atualizado!');
        setEditCell({ data: null, field: null });
        await fetchData({ mes, ano }); // Atualiza tabela
      } catch (err) {
        toast.error(err.message);
        console.error(err);
      }
    }
  }

  async function handleAltMode(data, modo) {

    //console.log('dados recebido: ', data, " modo: ", modo);
    toast.success('Registro atualizado!');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-gray shadow-md mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Image src="/logo.png" alt="ClockIn Logo" width={40} height={40} />
            </div>
            <div className="flex items-center">
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
                {Array.from({ length: new Date().getFullYear() - 2000 + 1 }, (_, i) => {
                  const year = 2000 + i;
                  return (
                    <option value={year} key={year}>
                      {year}
                    </option>
                  );
                })}
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
            Dias trabalhados: <b>{diasT}</b> — Saldo anterior: <b>{minutosParaHorasSaldo(saldoAnt)}</b>
          </p>

          {/* 🔹 Tabela Responsiva */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm text-center border-collapse">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="border px-3 py-2">Data</th>
                  <th className="border px-3 py-2">Dia</th>
                  <th className="border px-3 py-2">H1</th>
                  <th className="border px-3 py-2">H2</th>
                  <th className="border px-3 py-2">H3</th>
                  <th className="border px-3 py-2">H4</th>
                  <th className="border px-3 py-2">H5</th>
                  <th className="border px-3 py-2">H6</th>
                  <th className="border px-3 py-2">Trabalhadas</th>
                  <th className="border px-3 py-2">Nominais</th>
                  <th className="border px-3 py-2">Faltante</th>
                  <th className="border px-3 py-2">50%</th>
                  <th className="border px-3 py-2">100%</th>
                  <th className="border px-3 py-2">Saldo</th>
                  <th className="border px-3 py-2">Obs</th>
                  <th className="border px-3 py-2">Modo</th>
                </tr>
              </thead>
              <tbody>
                {registros.length > 0 ? (
                  registros.map((item, i) => {
                    const r = item.registros || {};
                    return (
                      <>
                        <tr
                          key={i}
                          style={
                            item.data === new Date().toISOString().split('T')[0]
                              ? { backgroundColor: '#cce5ff' } // azul claro para o dia atual
                              : item.diaSemana === 'Domingo'
                              ? { backgroundColor: '#f3bebeff' } // vermelho claro para domingo
                              : {}
                          }
                          className={
                            item.data === new Date().toISOString().split('T')[0]
                              ? "hover:bg-blue-100"
                              : item.diaSemana === 'Domingo'
                              ? "hover:bg-red-50"
                              : "hover:bg-gray-50"
                          }
                        >
                          <td className="border px-4 py-2 text-center">
                            {item.data.split("-").reverse().join("/")}
                          </td>
                          <td className="border px-4 py-2 text-center">
                            {item.diaSemana}
                          </td>
                          <td
                            className="border px-4 py-2 text-center cursor-pointer"
                            onDoubleClick={() => handleDoubleClick(item.data, 'hora1', r.hora1)}
                          >
                            {editCell.data === item.data && editCell.field === 'hora1' ? (
                              <input
                                type="time"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => handleEditKeyDown(e, item.data, 'hora1')}
                                onBlur={() => handleEditKeyDown({ key: 'Enter' }, item.data, 'hora1')}
                                className="border rounded px-2 py-1 w-20 text-center"
                                autoFocus
                              />
                            ) : (
                              r.hora1 || ''
                            )}
                          </td>

                          <td
                            className="border px-4 py-2 text-center cursor-pointer"
                            onDoubleClick={() => handleDoubleClick(item.data, 'hora2', r.hora2)}
                          >
                            {editCell.data === item.data && editCell.field === 'hora2' ? (
                              <input
                                type="time"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => handleEditKeyDown(e, item.data, 'hora2')}
                                onBlur={() => handleEditKeyDown({ key: 'Enter' }, item.data, 'hora2')}
                                className="border rounded px-2 py-1 w-20 text-center"
                                autoFocus
                              />
                            ) : (
                              r.hora2 || ''
                            )}
                          </td>

                          <td
                            className="border px-4 py-2 text-center cursor-pointer"
                            onDoubleClick={() => handleDoubleClick(item.data, 'hora3', r.hora3)}
                          >
                            {editCell.data === item.data && editCell.field === 'hora3' ? (
                              <input
                                type="time"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => handleEditKeyDown(e, item.data, 'hora3')}
                                onBlur={() => handleEditKeyDown({ key: 'Enter' }, item.data, 'hora3')}
                                className="border rounded px-2 py-1 w-20 text-center"
                                autoFocus
                              />
                            ) : (
                              r.hora3 || ''
                            )}
                          </td>

                          <td
                            className="border px-4 py-2 text-center cursor-pointer"
                            onDoubleClick={() => handleDoubleClick(item.data, 'hora4', r.hora4)}
                          >
                            {editCell.data === item.data && editCell.field === 'hora4' ? (
                              <input
                                type="time"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => handleEditKeyDown(e, item.data, 'hora4')}
                                onBlur={() => handleEditKeyDown({ key: 'Enter' }, item.data, 'hora4')}
                                className="border rounded px-2 py-1 w-20 text-center"
                                autoFocus
                              />
                            ) : (
                              r.hora4 || ''
                            )}
                          </td>

                          <td
                            className="border px-4 py-2 text-center cursor-pointer"
                            onDoubleClick={() => handleDoubleClick(item.data, 'hora5', r.hora5)}
                          >
                            {editCell.data === item.data && editCell.field === 'hora5' ? (
                              <input
                                type="time"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => handleEditKeyDown(e, item.data, 'hora5')}
                                onBlur={() => handleEditKeyDown({ key: 'Enter' }, item.data, 'hora5')}
                                className="border rounded px-2 py-1 w-20 text-center"
                                autoFocus
                              />
                            ) : (
                              r.hora5 || ''
                            )}
                          </td>

                          <td
                            className="border px-4 py-2 text-center cursor-pointer"
                            onDoubleClick={() => handleDoubleClick(item.data, 'hora6', r.hora6)}
                          >
                            {editCell.data === item.data && editCell.field === 'hora6' ? (
                              <input
                                type="time"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => handleEditKeyDown(e, item.data, 'hora6')}
                                onBlur={() => handleEditKeyDown({ key: 'Enter' }, item.data, 'hora6')}
                                className="border rounded px-2 py-1 w-20 text-center"
                                autoFocus
                              />
                            ) : (
                              r.hora6 || ''
                            )}
                          </td>
                          <td className="border px-4 py-2 text-center">
                            {minutosParaHoras(item.horas_trabalhadas)}
                          </td>
                          <td className="border px-4 py-2 text-center">
                            {minutosParaHoras(item.horas_nominais)}
                          </td>
                          {/* faltantes */}
                          <td className="border px-4 py-2 text-center">
                            {minutosParaHorasSaldo(item.saldo_minutos < 0 ? item.saldo_minutos : 0)}
                          </td>
                          {/* 50% */}
                          <td className="border px-4 py-2 text-center">
                            {minutosParaHorasSaldo(item.saldo_minutos > 0 ? item.saldo_minutos : 0)}
                          </td>
                          {/* 100% */}
                          <td className="border px-4 py-2 text-center">
                            {minutosParaHorasSaldo(item.saldo_100)}
                          </td>

                          <td className="border px-4 py-2 text-center">
                            {minutosParaHorasSaldo(item.saldo_periodo)}
                          </td>
                          <td
                            className="border px-4 py-2 text-center cursor-pointer"
                            onDoubleClick={() => handleDoubleClick(item.data, 'obs', r.obs)}
                          >
                            {editCell.data === item.data && editCell.field === 'obs' ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => handleEditKeyDown(e, item.data, 'obs')}
                                onBlur={() => handleEditKeyDown({ key: 'Enter' }, item.data, 'obs')}
                                className="border rounded px-2 py-1 w-full"
                                autoFocus
                              />
                            ) : (
                              r.obs || ''
                            )}
                          </td>

                          <td className="border px-4 py-2 text-center">
                            <select
                              onChange={(e) => handleAltMode(item.data, e.target.value)}
                              value={r.mode || ""}
                              className="border rounded-md px-2 py-1"
                            >
                              <option value="">-</option>
                              <option value="ferias">Ferias</option>
                              <option value="folga">Folga</option>
                              <option value="feriado">feriado</option>
                              <option value="feriado manha">Feriado pela Manha</option>
                              <option value="feriado tarde">Feriado pela Tarde</option>
                              <option value="bonificado">Folga Bonificada</option>
                              <option value="atestado">Atestado</option>
                              <option value="atestado manha">Atestado pela Manha</option>
                              <option value="atestado tarde">Atestado pela Tarde</option>
                            </select>
                          </td>

                        </tr>
                      </>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-gray-500">
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
