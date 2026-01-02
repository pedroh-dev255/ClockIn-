const pool = require('../configs/db');
const { configsService } = require('./configService');
const { getSaldo } = require("./saldoService");
const dayjs = require('dayjs');

async function setRegistroService(userId, data, coluna, value) {

  if(value == "") value = null;
  
  try {
    // 1️⃣ Verifica se o registro do dia já existe para o usuário
    const [rows] = await pool.promise().query(
      "SELECT id FROM registros WHERE user_id = ? AND data_registro = ?",
      [userId, data]
    );

    // 2️⃣ Se não existir, cria um novo registro
    if (rows.length === 0) {
      const insertQuery = `
        INSERT INTO registros (user_id, data_registro, ${coluna})
        VALUES (?, ?, ?)
      `;
      await pool.promise().query(insertQuery, [userId, data, value]);
      return { message: 'Registro criado com sucesso' };
    }

    // 3️⃣ Se já existir, apenas atualiza a coluna indicada
    const updateQuery = `
      UPDATE registros 
      SET ${coluna} = ? 
      WHERE user_id = ? AND data_registro = ?
    `;
    await pool.promise().query(updateQuery, [value, userId, data]);

    return { message: 'Registro atualizado com sucesso' };

  } catch (error) {
    console.error('Erro no setRegistroService:', error);
    throw new Error('Erro ao salvar o registro');
  }
}

async function getRegistrosService(userId, periodo) {

    try {
        const fechamentoConfig = await configsService(userId, 'fechamento_mes');
        const max50 = Number(await configsService(userId, 'maximo50')) || 0;
        const toleranciaPonto = Number(await configsService(userId, 'toleranciaPonto')) || 5;
        const toleranciaGeral = Number(await configsService(userId, 'toleranciaGeral')) || 10;

        const diaFechamento = Number(fechamentoConfig) || 25;

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

        const fimAnterior = new Date(fim);
        fimAnterior.setMonth(fimAnterior.getMonth() - 1);

        const periodoAnterior = formatDate(fimAnterior);
        const saldoAnterior = (await getSaldo(userId, periodoAnterior));

        //console.log(periodoAnterior);

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

        if(nominals.length === 0 ) {
            throw new Error('Horas nominais não cadastradas');
        }

        let saldoPeriodo = saldoAnterior || 0;

        const registrosPorDia = diasPeriodo.map((dia) => {
            const registro = rows.find(r => r.data_registro.toISOString().split('T')[0] === dia);
            const diaSemana = getDiaSemana(new Date(dia));
            const nominal = nominals.find(n => n.dia_semana === diaSemana);
            const dataAtual = dayjs(dia);

            let horasNominaisMin = nominal ? calcularHorasEmMinutos(nominal) : 0;
            let horasTrabalhadasMin = 0;
            let saldoMin = 0;
            let saldo100 = 0;

            const mode = registro?.mode || null;

            if (mode && nominal) {
                const horasManha = calcularHorasEmMinutos({ hora1: nominal.hora1, hora2: nominal.hora2 });
                const horasTarde = calcularHorasEmMinutos({ hora3: nominal.hora3, hora4: nominal.hora4 });

                const horasManhaFeriado = calcularHorasEmMinutos({ hora1: '08:00', hora2: '12:00' });
                const horasTardeFeriado = calcularHorasEmMinutos({ hora3: '14:00', hora4: '18:00' });


                switch (mode) {
                    case 'ferias':
                    case 'feriado':
                    case 'atestado':
                    case 'bonificado':
                        horasNominaisMin = 0; // zera o dia inteiro
                        break;

                    case 'feriado manha':
                        horasNominaisMin -= horasManhaFeriado;
                        break;

                    case 'atestado manha':
                        horasNominaisMin -= horasManha;
                        break;

                    case 'feriado tarde':
                        horasNominaisMin -= horasTardeFeriado;
                        break;
                    case 'atestado tarde':
                        horasNominaisMin -= horasTarde;
                        break;

                    case 'folga':
                        // não afeta cálculos, mas não zera
                        break;
                }
            }

            if (registro && nominal) {
                horasTrabalhadasMin = calcularHorasComToleranciaEmMinutos(registro, nominal, toleranciaPonto);
                saldoMin = horasTrabalhadasMin - horasNominaisMin;

                if (Math.abs(saldoMin) < toleranciaGeral) saldoMin = 0;

                // 🔹 Cálculo de saldo 100%
                const isDiaUtil = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].includes(diaSemana);

                if (isDiaUtil && saldoMin > 0) {
                    // Tudo acima de max50 é 100%
                    if (saldoMin > max50) {
                        saldo100 = saldoMin - max50;
                        saldoMin = max50; // o restante fica como 50%
                    }
                } else if (!isDiaUtil && saldoMin > 0) {
                    // Fim de semana → tudo é 100%
                    saldo100 = saldoMin;
                    saldoMin = 0;
                }

            } else {
                if (dataAtual.isBefore(hoje, 'day') || dataAtual.isSame(hoje, 'day')) {
                    saldoMin = -horasNominaisMin;
                } else {
                    saldoMin = 0;
                }
            }

            saldoPeriodo += (saldoMin + saldo100);

            return {
                data: dia,
                diaSemana,
                registros: registro || null,
                horas_nominais: horasNominaisMin,
                horas_trabalhadas: horasTrabalhadasMin,
                saldo_minutos: saldoMin,
                saldo_100: saldo100,
                saldo_periodo: saldoPeriodo
            };
        });

        return {
            dt_inicio,
            dt_fim,
            num_dias_mes: diasPeriodo.length,
            saldo_anterior: saldoAnterior,
            saldoPeriodo,
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

    const pares = [
        ['hora1', 'hora2'],
        ['hora3', 'hora4'],
        ['hora5', 'hora6']
    ];

    pares.forEach(([inicio, fim]) => {
        if (registro[inicio] && registro[fim] && nominal[inicio] && nominal[fim]) {
            let entradaReal = dayjs(`2000-01-01 ${registro[inicio]}`);
            let saidaReal   = dayjs(`2000-01-01 ${registro[fim]}`);
            const entradaNominal = dayjs(`2000-01-01 ${nominal[inicio]}`);
            const saidaNominal   = dayjs(`2000-01-01 ${nominal[fim]}`);

            // 🔹 Aplica tolerância SOMENTE na entrada da manhã (hora1)
            if (inicio === "hora1") {
                const diffEntrada = entradaReal.diff(entradaNominal, "minute");
                if (Math.abs(diffEntrada) <= toleranciaMin) {
                    entradaReal = entradaNominal;
                }
            }

            // 🔹 Aplica tolerância SOMENTE na saída da tarde (hora4)
            if (fim === "hora4") {
                const diffSaida = saidaReal.diff(saidaNominal, "minute");
                if (Math.abs(diffSaida) <= toleranciaMin) {
                    saidaReal = saidaNominal;
                }
            }

            // 🔹 Para hora3/hora5/hora6 → sem tolerância nominal (somente cálculo normal)
            total += saidaReal.diff(entradaReal, "minute");
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
