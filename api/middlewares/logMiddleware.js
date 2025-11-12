const { logInfo } = require('../services/logService');

async function logMiddleware(req, res, next) {
    try {
        // Monta a rota completa
        const fullRoute = `${req.baseUrl}${req.path}`;
        const userId = req.user?.id || null;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Loga requisições HTTP
        await logInfo(
            `Requisição recebida: ${req.method} ${fullRoute}`,
            'http',
            userId,
            {
                method: req.method,
                url: req.originalUrl,
                params: req.params,
                query: req.query,
                //body: req.body
            },
            ip
        );

        next();
    } catch (error) {
        console.error('Erro no logMiddleware:', error.message);
        next();
    }
}

module.exports = logMiddleware;
