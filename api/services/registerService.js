const pool = require('../configs/db');
const { configsService } = require('./configService');
const dayjs = require('dayjs');

async function setRegistroService(userId, data, colum, value) {
    try {
        //verifica se o registro existe
        const [registro] = await pool.query("SELECT * FROM registros WHERE data_registro = ? AND id = ?", [data, userId]);

        if(!registro){
            throw new Error("Dia não cadastrado");
        }
    } catch (error) {
        throw new Error(error.message);
    }
}

async function getRegistrosService(userId, periodo) {
    try {
        const fechamentoConfig = await configsService(userId, 'fechamento_mes');
        const diaFechamento = Number(fechamentoConfig) || 25;

        const toleranciaPonto = Number(await configsService(userId, 'toleranciaPonto')) || 5;
        const toleranciaGeral = Number(await configsService(userId, 'toleranciaGeral')) || 10;

        let inicio, fim;

        if (periodo) {
            const [ano, mes] = periodo.includes('/')
                ? periodo.split('/').reverse().map(Number)
                : periodo.split('-').map(Number);

            inicio = new Date(ano, mes - 2, diaFechamento + 1);
            fim = new Date(ano, mes - 1, diaFechamento);
        } else {
            const hoje = new Date();
            const diaAtual = hoje.getDate();

            inicio = new Date(hoje);
            fim = new Date(hoje);

            if (diaAtual > diaFechamento) {
                inicio.setDate(diaFechamento + 1);
                fim.setMonth(fim.getMonth() + 1);
                fim.setDate(diaFechamento);
            } else {
                inicio.setMonth(inicio.getMonth() - 1);
                inicio.setDate(diaFechamento + 1);
                fim.setDate(diaFechamento);
            }
        }

        const formatDate = (date) => date.toISOString().split('T')[0];
        const dt_inicio = formatDate(inicio);
        const dt_fim = formatDate(fim);

        const diasPeriodo = generateDateRange(inicio, fim);
        const hoje = dayjs();

        const [rows] = await pool.promise().query(
            `SELECT * FROM registros WHERE user_id = ? AND data_registro BETWEEN ? AND ? ORDER BY data_registro ASC`,
            [userId, dt_inicio, dt_fim]
        );

        const [nominals] = await pool.promise().query(
            `SELECT * FROM nominals WHERE user_id = ?`,
            [userId]
        );

        let saldoPeriodo = 0;

        const registrosPorDia = diasPeriodo.map((dia) => {
            const registro = rows.find(r => r.data_registro.toISOString().split('T')[0] === dia);
            const diaSemana = getDiaSemana(new Date(dia));
            const nominal = nominals.find(n => n.dia_semana === diaSemana);

            const horasNominaisMin = nominal ? calcularHorasEmMinutos(nominal) : 0;
            const dataAtual = dayjs(dia);

            let horasTrabalhadasMin = 0;
            let saldoMin = 0;

            if (registro && nominal) {
                horasTrabalhadasMin = calcularHorasComToleranciaEmMinutos(registro, nominal, toleranciaPonto);
                saldoMin = horasTrabalhadasMin - horasNominaisMin;

                if (Math.abs(saldoMin) <= toleranciaGeral) saldoMin = 0;
            } else {
                if (dataAtual.isBefore(hoje, 'day') || dataAtual.isSame(hoje, 'day')) {
                    saldoMin = -horasNominaisMin;
                } else {
                    saldoMin = 0;
                }
            }

            saldoPeriodo += saldoMin;

            return {
                data: dia,
                diaSemana,
                registros: registro || null,
                horas_nominais: horasNominaisMin,
                horas_trabalhadas: horasTrabalhadasMin,
                saldo_minutos: saldoMin,
                saldo_100: 0,
                saldo_periodo: saldoPeriodo
            };
        });

        return {
            dt_inicio,
            dt_fim,
            num_dias_mes: diasPeriodo.length,
            saldo_anterior: null,
            registros: registrosPorDia
        };

    } catch (error) {
        throw new Error(error.message);
    }
}

/** 🔹 Calcula total de horas nominais (em minutos) */
function calcularHorasEmMinutos(row) {
    let total = 0;
    const pares = [['hora1', 'hora2'], ['hora3', 'hora4'], ['hora5', 'hora6']];
    pares.forEach(([inicio, fim]) => {
        if (row[inicio] && row[fim]) {
            const h1 = dayjs(`2000-01-01 ${row[inicio]}`);
            const h2 = dayjs(`2000-01-01 ${row[fim]}`);
            total += h2.diff(h1, 'minute');
        }
    });
    return total;
}

/** 🔹 Calcula total de horas trabalhadas aplicando tolerância (em minutos) */
function calcularHorasComToleranciaEmMinutos(registro, nominal, toleranciaMin) {
    let total = 0;
    const pares = [['hora1', 'hora2'], ['hora3', 'hora4'], ['hora5', 'hora6']];

    pares.forEach(([inicio, fim]) => {
        if (registro[inicio] && registro[fim] && nominal[inicio] && nominal[fim]) {
            let entradaReal = dayjs(`2000-01-01 ${registro[inicio]}`);
            let saidaReal = dayjs(`2000-01-01 ${registro[fim]}`);
            const entradaNominal = dayjs(`2000-01-01 ${nominal[inicio]}`);
            const saidaNominal = dayjs(`2000-01-01 ${nominal[fim]}`);

            // 🔹 Ajuste de tolerância de ENTRADA
            const diffEntrada = entradaReal.diff(entradaNominal, 'minute');
            if (Math.abs(diffEntrada) <= toleranciaMin) {
                entradaReal = entradaNominal; // dentro da tolerância, considera pontual
            }

            // 🔹 Ajuste de tolerância de SAÍDA
            const diffSaida = saidaReal.diff(saidaNominal, 'minute');
            if (Math.abs(diffSaida) <= toleranciaMin) {
                saidaReal = saidaNominal; // dentro da tolerância, considera pontual
            }

            total += saidaReal.diff(entradaReal, 'minute');
        }
    });

    return total;
}

function getDiaSemana(date) {
    const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    return dias[date.getDay()];
}

function generateDateRange(inicio, fim) {
    const dias = [];
    const current = new Date(inicio);
    while (current <= fim) {
        dias.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    return dias;
}

module.exports = {
    getRegistrosService,
    setRegistroService
};
