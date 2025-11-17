'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Navbar from '../components/navbar'
import { EyeIcon, EyeOffIcon } from 'lucide-react';


export default function SaldosPage() {
  const [ano, setAno] = useState();
  const [saldos, setSaldos] = useState([]);
  const [diaFechamento, setDiaFechamento] = useState();
  const [edit, setEdit] = useState(false);
  const [selectedPeriodo, setSelectedPeriodo] = useState(null);
  const [saldoManual, setSaldoManual] = useState("");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function getSaldos(ano) {
    setLoading(true);
    try {
      const res = await fetch('/api/saldos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ano }),
        credentials: 'include',
      });

      const response = await fetch(`/api/configs/fechamento_mes`);
      const fechamentoConfig = await response.json();
      const diaFechamento = Number(fechamentoConfig.data);
      setDiaFechamento(diaFechamento)
      const dados = await res.json();

      //console.log(dados)

      if (!res.ok) throw new Error(dados.error || 'Erro ao carregar saldos');
      
      setSaldos(dados.data);
      setLoading(false);

    } catch (error) {
      toast.error(error.message || 'Erro ao carregar saldos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setAno(new Date().getFullYear());
    getSaldos(new Date().getFullYear())
  }, []);


  async function handleChange(value) {
    setAno(value);
    await getSaldos(value);
  }

  async function handleRecalc(periodo){
    //console.log(periodo);
    const res = await fetch('/api/saldos/recalc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        periodo
      })
    });

    if(!res.ok) toast.error('Erro ao recalcular saldos');

    await getSaldos(ano);
    toast.success('saldo recalculado');
    //console.log(res);
  }


  async function handleSalvarCorrecao() {
    if (!saldoManual) {
      toast.error("Defina o saldo do período.");
      return;
    }

    try {
      setSaving(true);

      //converte o saldo em minutos

      let saldo = horasParaMinutos(saldoManual);

      //console.log(saldoManual, " - ", saldo)

      const res = await fetch("/api/saldos/correcao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          periodo: selectedPeriodo,
          saldo,
          obs
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Saldo atualizado com sucesso!");

      setEdit(false);
      setSaldoManual("");
      setObs("");

      await getSaldos(ano);

    } catch (err) {
      toast.error("Erro ao Atualizar Saldo");
    } finally {
      setSaving(false);
    }
  }


  async function handleTogglePago(item) {
    try {
      const novoValor = item.s100_pg === 1 ? 0 : 1;

      const res = await fetch('/api/saldos/updatePago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          periodo: new Date(item.periodo).toLocaleDateString('pt-BR'),
          value: novoValor
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Erro ao atualizar pagamento');
      }

      // Atualiza a tela sem reload
      setSaldos((atual) =>
        atual.map((s) =>
          s.mes === item.mes
            ? { ...s, s100_pg: novoValor }
            : s
        )
      );

      toast.success('Pagamento atualizado!');

    } catch (error) {
      toast.error(error.message);
    }
  }


  function minutosParaHoras(minutos) {
    // Se quiser sempre mostrar algo (ex: "00:00" quando 0)
    const sinal = minutos < 0 ? "-" : "";
    const total = Math.abs(Math.trunc(minutos));
    const horas = Math.floor(total / 60);
    const mins = total % 60;

    return `${sinal}${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  }

  function horasParaMinutos(horasStr) {
    if (!horasStr || !horasStr.includes(":")) return 0;

    const negativo = horasStr.startsWith("-");
    const [h, m] = horasStr.replace("-", "").split(":").map(Number);

    const total = h * 60 + m;
    return negativo ? -total : total;
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
        {edit && (
          <div style={{backgroundColor: "rgba(0, 0, 0, 0.8)"}} className="fixed inset-0 flex justify-center items-center z-50">
            <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 animate-fade-in">
              
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Correção de Saldo
              </h2>

              <p className="text-sm text-gray-600 mb-3">
                Período selecionado:
                <span className="font-semibold ml-1">
                  {selectedPeriodo}
                </span>
              </p>

              {/* Campo de saldo manual */}
              <label className="block mb-4">
                <span className="font-semibold text-gray-700">Saldo (em horas) *</span>
                <div className="flex gap-3 mt-2 items-center">
                  {/* Campo de hora */}
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2
                              focus:ring-2 focus:ring-blue-400 focus:outline-none font-mono"
                    placeholder="ex: 02:30 ou -10:20 ou 60:00"
                    value={saldoManual}
                    onChange={(e) => {
                      let v = e.target.value;

                      // Permitir somente números, :, - 
                      v = v.replace(/[^0-9:-]/g, "");

                      // Garantir apenas um '-' e somente no início
                      v = v.replace(/(?!^)-/g, ""); 

                      // Garantir apenas um ':'
                      const countDots = (v.match(/:/g) || []).length;
                      if (countDots > 1) return;

                      // Validar minutos ao digitar (não deixa passar de 2 dígitos)
                      const parts = v.split(":");

                      if (parts.length === 2) {
                        let [h, m] = parts;

                        // Se passar de 2 dígitos em minutos → corta
                        if (m.length > 2) m = m.slice(0, 2);

                        // Se minutos > 59 → limita
                        if (Number(m) > 59) m = "59";

                        v = `${h}:${m}`;
                      }

                      setSaldoManual(v);
                    }}
                    required
                  />
                </div>
              </label>

              {/* Campo de observação */}
              <label className="block mb-4">
                <span className="font-semibold text-gray-700">Observação (opcional)</span>
                <textarea
                  className="w-full border rounded-lg p-2 mt-1"
                  rows="3"
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                ></textarea>
              </label>

              {/* Botões */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                  onClick={() => setEdit(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={handleSalvarCorrecao}
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="max-w-5xl mx-auto w-full p-6 mt-4 bg-white shadow rounded-2xl">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">⌚ Ajuste de Saldo</h1>
          <div className="mb-8 text-right">
            <label className="font-semibold text-gray-700 ">Ano a filtrar: </label>
            <input
              type="number"
              style={{height: "28px", width: 80}}
              className="text-right border rounded-lg p-1 focus:ring-2 focus:ring-blue-400 outline-none"
              value={ano}
              onChange={(e) => handleChange(Number(e.target.value))}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 text-center">Periodo</th>
                  <th className="p-2 text-center">Saldo</th>
                  <th className="p-2 text-center">100%</th>
                  <th className="p-2 text-center">100% foi pago?</th>
                  <th className="p-2 text-center">Correção de saldo</th>
                  <th className="p-2 text-center">Salvar</th>
                </tr>
              </thead>
              <tbody>
                {saldos.map((item) => (
                  <tr key={item.mes} className="border-t">
                    
                    {/* Periodo (mês formatado ou '--') */}
                    <td className="p-2 text-center">
                      {item.periodo ? new Date(item.periodo).toLocaleDateString('pt-BR') : new Date(`${ano}-${item.mes}-${diaFechamento}`).toLocaleDateString('pt-BR')}
                    </td>

                    {/* Saldo */}
                    <td   style={{ fontWeight: 'bold', color: item.saldo_sys >= 0 ? 'green' : 'red' }} className="p-2 text-center">
                      {item.ajuste ? item.ajuste ? `${minutosParaHoras(item.ajuste)}*` : '--' : (item.saldo_sys ? minutosParaHoras(item.saldo_sys) : '--')}
                    </td>

                    {/* 100% */}
                    <td className="p-2 text-center">
                      {item.saldo_100 ? minutosParaHoras(item.saldo_100) : '--'}
                    </td>

                    {/* 100% foi pago */}
                    <td className="p-2 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={item.s100_pg === 1}
                          onChange={() => handleTogglePago(item)}
                        />
                        {/* track */}
                        <span className="w-11 h-6 rounded-full block bg-gray-300 peer-checked:bg-green-500 transition-colors"></span>
                        {/* knob */}
                        <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow transform transition-transform peer-checked:translate-x-5"></span>
                      </label>
                    </td>

                    {/* Ações */}
                    <td className="p-1 text-center">
                      <button
                        type="button"
                        className="bg-green-200 px-4 py-2 rounded-lg hover:bg-green-400 transition cursor-pointer"
                        onClick={() => handleRecalc(`${item.mes}/${ano}`)}
                      >
                        Recalcular Saldo
                      </button>
                    </td>

                    <td className="text-center">
                      <button
                        type="button"
                        className="bg-yellow-200 px-4 py-2 rounded-lg hover:bg-yellow-400 transition cursor-pointer"
                        onClick={() => {
                          setSaldoManual(item.saldo_sys ? minutosParaHoras(item.saldo_sys) : null)
                          setSelectedPeriodo(  item.periodo
                            ? new Date(item.periodo).toLocaleDateString('pt-BR')
                            : `${diaFechamento}/${String(item.mes).padStart(2, "0")}/${ano}`
                          );
                          setEdit(true);
                        }}
                      >
                        Correção de Saldo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>
      </div>

  );

}
