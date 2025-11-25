const pool = require('../configs/db');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { logInfo, logError, logDebug } = require('../services/logService');
dotenv.config();

async function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress;

    if (!authHeader) {
        await logError('Token de autenticacao nao fornecido', 'auth', null, { method: req.method, url: req.url }, ip);
        return res.status(401).json({ 
            success: false,
            message: 'Token de autenticacao obrigatorio' 
        });
    }
    const token = authHeader.split(' ')[1];
    try {
        const [rows] = await pool.promise().query(
            'SELECT id FROM logins WHERE token = ? AND login_time >= NOW() - INTERVAL 24 HOUR',
            [token]
        );
        if (rows.length === 0 || jwt.verify(token, process.env.JWT_SECRET) == null) {
            await logError('Tentativa de acesso com token invalido', 'auth', null, { method: req.method, url: req.originalUrl }, ip);
            return res.status(403).json({ 
                success: false,
                message: 'Token de autenticacao invalido' 
            });
        }

        //await logInfo('Token de autenticacao validado com sucesso', 'auth', null, { method: req.method, url: req.url }, req.ip);

        next();
    } catch (error) {
        await logError('Erro ao validar token de autenticacao', 'auth', null, { method: req.method, url: req.originalUrl, erro: error.message }, ip);
        return res.status(500).json({ 
            success: false,
            message: 'Erro no servidor' 
        });
    }
}

module.exports = authMiddleware;