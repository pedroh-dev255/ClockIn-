const dotenv = require('dotenv');
const { logInfo, logError } = require('../services/logService');
dotenv.config();


async function tokenMiddleware(req, res, next) {
    const token = req.headers['apptoken'];

    if (!token) {
        logError('Token de app nao fornecido', 'auth', null, { method: req.method, url: req.originalUrl }, req.ip);
        return res.status(401).json({ 
            success: false,
            message: 'Token obrigatorio' 
        });
    }

    if (token !== process.env.APP_TOKEN) {
        logError('Token de app invalido', 'auth', null, { method: req.method, url: req.originalUrl }, req.ip);
        return res.status(403).json({ 
            success: false,
            message: 'Token invalido' 
        });
    }


    next();
    
}

module.exports = tokenMiddleware;