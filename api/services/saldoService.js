const pool = require("../configs/db");


async function salvarSaldoMensal(userId, dt_fim, saldoSys, saldo100) {
    try {
        const [existe] = await pool.promise().query("SELECT * FROM saldos WHERE user_id = ? AND periodo = ?",
            [userId, dt_fim]
        );

        let result
        if(existe.length > 0){
            result = await pool.promise().query("UPDATE saldos SET saldo_sys = ?, saldo_100 = ? WHERE user_id = ? AND periodo = ?;",
                [saldoSys, saldo100, userId, dt_fim]
            );
        }else {
            result = await pool.promise().query("insert into saldos(user_id, periodo, saldo_sys, saldo_100) value (?, ?, ?, ?);",
                [userId, dt_fim, saldoSys, saldo100]
            );
        }

        if(!result) throw new Error('Erro ao salvar saldo');

        return true;
        
    } catch (error) {
        throw new Error(error.message);
    }
}

async function getSaldo(userId, periodo) {
    try {
        const [result] = await pool.promise().query("SELECT * FROM saldos WHERE user_id = ? AND periodo = ?",
            [userId, periodo]
        );

        if(!result[0]) return 0;

        //console.log(periodo, result[0].saldo_sys);

        if(result[0].ajuste || result[0].ajuste == 0){
            return Number(result[0].ajuste || 0);
        }

        if(result[0].s100_pg === true || result[0].s100_pg == 1){
            return Number(result[0].saldo_sys) - Number(result[0].saldo_100);
        }

        return Number(result[0].saldo_sys);

    } catch (error) {
        throw new Error(error.message);
    }
    
}

async function getSaldosService(userId, ano) {
    try {

        const sql = `
            WITH RECURSIVE months AS (
                SELECT 1 AS mes
                UNION ALL
                SELECT mes + 1 FROM months WHERE mes < 12
            )
            SELECT 
                m.mes,
                s.id,
                s.user_id,
                s.periodo,
                s.saldo_sys,
                s.saldo_100,
                s.s100_pg,
                s.ajuste,
                s.obs
            FROM months m
            LEFT JOIN saldos s 
                ON MONTH(s.periodo) = m.mes
                AND YEAR(s.periodo) = ?
                AND s.user_id = ?
            ORDER BY m.mes;
        `;

        const [rows] = await pool.promise().query(sql, [Number(ano), userId]);

        return rows;

    } catch (error) {
        console.error(error);
        throw new Error("Erro ao buscar saldos");
    }
}

async function updateSaldoService(userId, periodo, saldo, obs) {
    try {
        // Converte DD/MM/YYYY → YYYY-MM-DD
        const [dia, mes, ano] = periodo.split("/");
        const periodoSQL = `${ano}-${mes}-${dia}`;

        // 1️⃣ Verificar se já existe registro
        const [existe] = await pool.promise().query(
            "SELECT id FROM saldos WHERE user_id = ? AND periodo = ?",
            [userId, periodoSQL]
        );

        if (existe.length > 0) {
            // 2️⃣ Atualizar registro existente
            await pool.promise().query(
                `UPDATE saldos 
                SET ajuste = ?, obs = ? 
                WHERE id = ?`,
                [saldo, obs || null, existe[0].id]
            );

            return true
        }

        // 3️⃣ Criar novo registro se não existir
        await pool.promise().query(
            `INSERT INTO saldos (user_id, periodo, saldo_sys, saldo_100, s100_pg, ajuste, obs)
             VALUES (?, ?, 0, 0, false, ?, ?)`,
            [userId, periodoSQL, saldo, obs || null]
        );

        return true

    } catch (error) {
        console.error("Erro updateSaldoService:", error);
        throw new Error("Erro ao atualizar saldo");
    }
}

async function updateSaldoPgService(userId, periodo, value) {
    try {

        const [dia, mes, ano] = periodo.split("/");
        const periodoSQL = `${ano}-${mes}-${dia}`;

        // 1️⃣ Verificar se já existe registro
        const [existe] = await pool.promise().query(
            "SELECT * FROM saldos WHERE user_id = ? AND periodo = ?",
            [userId, periodoSQL]
        );

        if (existe.length > 0) {

            // 2️⃣ Atualizar registro existente
            await pool.promise().query(
                `UPDATE saldos 
                SET s100_pg = ?
                WHERE id = ?`,
                [value, existe[0].id]
            );

            return true
        }

        // 3️⃣ Criar novo registro se não existir
        await pool.promise().query(
            `INSERT INTO saldos (user_id, periodo, saldo_sys, saldo_100, s100_pg, ajuste, obs)
             VALUES (?, ?, 0, 0, ?, 0, null)`,
            [userId, periodoSQL, value]
        );

        return true
        
    } catch (error) {
        throw new Error(error.message);
    }
    
}

module.exports = {
    salvarSaldoMensal,
    getSaldo,
    getSaldosService,
    updateSaldoService,
    updateSaldoPgService
}