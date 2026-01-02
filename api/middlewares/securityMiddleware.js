const redis = require('../configs/redisClient');
const { logInfo, logError } = require('../services/logService');

// ================= CONFIG =================
const RATE_LIMIT_WINDOW = 60;     // segundos
const RATE_LIMIT_MAX = 60;        // req/min por IP
const BLOCK_TIME = 300;           // segundos (ban temporário)

const LOGIN_LIMIT_MAX = 10;       // login/min
const LOGIN_WINDOW = 60;

// =========================================

function getClientIP(req) {
    const forwarded = req.headers['x-forwarded-for'];
    return forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
}

async function rateLimit(key, max, window) {
    const current = await redis.incr(key);

    if (current === 1) {
        await redis.expire(key, window);
    }

    return current > max;
}

async function isBlocked(ip) {
    return await redis.exists(`block:${ip}`);
}

async function blockIP(ip, reason) {
    await redis.setex(`block:${ip}`, BLOCK_TIME, reason);
}

async function securityMiddleware(req, res, next) {
    const ip = getClientIP(req);
    const route = req.originalUrl;
    const method = req.method;
    const appToken = req.headers['apptoken'];
    const userToken = req.headers['authorization'] || null;

    try {
        // 🚫 IP BLOQUEADO
        if (await isBlocked(ip)) {
            logError(
                'IP bloqueado',
                'security',
                null,
                { route, method },
                ip
            );

            return res.status(403).json({
                success: false,
                message: 'IP temporariamente bloqueado'
            });
        }

        // 🔥 RATE LIMIT GLOBAL
        const rateKey = `rate:${ip}`;
        if (await rateLimit(rateKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)) {
            await blockIP(ip, 'Rate limit excedido');

            logError(
                'Rate limit excedido',
                'security',
                null,
                { route, method },
                ip
            );

            return res.status(429).json({
                success: false,
                message: 'Muitas requisições'
            });
        }

        // 🔐 APP TOKEN OBRIGATÓRIO
        if (!appToken || appToken !== process.env.APP_TOKEN) {
            await rateLimit(`invalid_token:${ip}`, 5, 60);

            logError(
                'App token inválido',
                'auth',
                null,
                { route, method },
                ip
            );

            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }

        // 🔑 PROTEÇÃO DE LOGIN
        if (route.includes('/login')) {
            const loginKey = `login:${ip}`;

            if (await rateLimit(loginKey, LOGIN_LIMIT_MAX, LOGIN_WINDOW)) {
                await blockIP(ip, 'Brute force login');

                logError(
                    'Tentativa de brute force',
                    'auth',
                    null,
                    { route, method },
                    ip
                );

                return res.status(429).json({
                    success: false,
                    message: 'Muitas tentativas de login'
                });
            }
        }

        // 📊 MONITORAMENTO
        await redis.incr('metrics:requests');
        await redis.incr(`metrics:route:${route}`);
        await redis.incr(`metrics:ip:${ip}`);

        // 🧠 CONTEXTO GLOBAL (opcional)
        req.security = {
            ip,
            appToken: !!appToken,
            userToken: !!userToken
        };

        next();

    } catch (err) {
        logError(
            'Falha no middleware de segurança',
            'security',
            err,
            { route, method },
            ip
        );

        return res.status(500).json({
            success: false,
            message: 'Erro interno'
        });
    }
}

module.exports = securityMiddleware;
