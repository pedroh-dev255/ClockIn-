const pool = require('../configs/db');

async function configsService(userId, chave) {
    try {
        if(chave == '*'){
            const [conf] = await pool.promise().query(
                'SELECT * FROM configs WHERE user_id = ? ',
                [userId]
            );
            const [nominal] = await pool.promise().query(
                'SELECT * FROM nominals WHERE user_id = ? ',
                [userId]
            )

            if (conf.length === 0 || nominal === 0) {
                throw new Error('Configurações do usuario não existem');
            }

            return {conf, nominal};
        }else{
            const [rows] = await pool.promise().query(
                'SELECT * FROM configs WHERE user_id = ? AND config_key = ?',
                [userId, chave]
            );
            if (rows.length === 0) {
                throw new Error('Configuração não encontrada');
            }
            return rows[0].config_value;
        }
    } catch (error) {
        
        throw new Error(error.message);
    }   
}

async function updateConfigs(userId, configs, nominais) {
    const connection = await pool.promise().getConnection();
    try {
        await connection.beginTransaction();

        // Atualizar CONFIGS
        for (const conf of configs) {
            await connection.query(
                `UPDATE configs 
                 SET config_value = ? 
                 WHERE id = ? AND user_id = ?`,
                [conf.config_value, conf.id, userId]
            );
        }

        // Atualizar NOMINAIS
        for (const n of nominais) {
            await connection.query(
                `UPDATE nominals
                 SET hora1 = ?, hora2 = ?, hora3 = ?, hora4 = ?, hora5 = ?, hora6 = ?
                 WHERE id = ? AND user_id = ?`,
                [
                    n.hora1 || null,
                    n.hora2 || null,
                    n.hora3 || null,
                    n.hora4 || null,
                    n.hora5 || null,
                    n.hora6 || null,
                    n.id,
                    userId
                ]
            );
        }

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        console.error('Erro ao atualizar configs:', error);
        throw new Error('Erro ao atualizar configurações no banco de dados');
    } finally {
        connection.release();
    }
}

module.exports = {
    configsService,
    updateConfigs
};