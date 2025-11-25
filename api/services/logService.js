const fs = require('fs');
const path = require('path');
const pool = require('../configs/db');
const dotenv = require('dotenv');
dotenv.config();


const TIMEZONE = process.env.TZ || 'America/Sao_Paulo';

// Caminho dos logs locais
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

function getLocalDate() {
    const parts = new Date()
        .toLocaleDateString('pt-BR', { timeZone: TIMEZONE })
        .split('/');
    return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
}

const logFile = path.join(logDir, `${getLocalDate()}.log`);

function getLocalTimestamp() {
    return new Date().toLocaleString('pt-BR', { timeZone: TIMEZONE });
}

/**
 * Cria um log tanto no arquivo quanto no banco de dados.
 * @param {Object} options - Dados do log
 * @param {string} options.level - Nível do log: info | warn | error | debug
 * @param {string} options.message - Mensagem principal
 * @param {number} [options.user_id] - ID do usuário (opcional)
 * @param {string} [options.context] - Contexto (ex: "auth", "pedido", "sistema")
 * @param {Object} [options.data] - Dados adicionais (ex: req.body)
 * @param {string} [options.ip] - IP de origem
 */
async function log({ level = 'info', message, user_id = null, context = null, data = null, ip = null }) {
    try {
        // 🧩 Monta a linha do log (para o arquivo)
        const timestamp = getLocalTimestamp();

        const line = `[${timestamp}] [${level.toUpperCase()}] ${context ? `[${context}] ` : ''}${message}${user_id ? ` (user:${user_id})` : ''}${ip ? ` (ip:${ip})` : ''}\n`;

        // 🔹 Salva no arquivo
        fs.appendFileSync(logFile, line);

        // 🔹 Salva no banco
        await pool.promise().query(
            `INSERT INTO logs (user_id, level, context, message, data, ip)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, level, context, message, data ? JSON.stringify(data) : null, ip]
        );
    } catch (error) {
        console.error('Erro ao salvar log:', error.message);
    }
}

// 🔹 Logs rápidos de nível específico:
const logInfo  = (msg, ctx, user, data, ip) => log({ level: 'info',  message: msg, context: ctx, user_id: user, data, ip });
const logWarn  = (msg, ctx, user, data, ip) => log({ level: 'warn',  message: msg, context: ctx, user_id: user, data, ip });
const logError = (msg, ctx, user, data, ip) => log({ level: 'error', message: msg, context: ctx, user_id: user, data, ip });
const logDebug = (msg, ctx, user, data, ip) => log({ level: 'debug', message: msg, context: ctx, user_id: user, data, ip });

module.exports = {
    log,
    logInfo,
    logWarn,
    logError,
    logDebug
};
