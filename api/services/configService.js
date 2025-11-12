const pool = require('../configs/db');

async function configsService(userId, chave) {
    try {
        const [rows] = await pool.promise().query(
            'SELECT * FROM configs WHERE user_id = ? AND config_key = ?',
            [userId, chave]
        );
        if (rows.length === 0) {
            throw new Error('Configuração não encontrada');
        }
        return rows[0].config_value;
    } catch (error) {
        
        throw new Error(error.message);
    }   
}

module.exports = {
    configsService
};