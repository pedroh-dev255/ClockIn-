const {loginService, registerService} = require('../services/userService.js');
const { logError, logWarn, logInfo, log } = require('../services/logService');

async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            success: false,
            message: 'Email e senha sao obrigatorios' 
        });
    }

    try {
        const result = await loginService(email, password);
        await logInfo('Login realizado com sucesso', 'auth', result.id, { email: email }, req.ip);
        return res.status(200).json({ 
            success: true,
            result 
        });
        
    } catch (error) {
        await logWarn('Falha na tentativa de login', 'auth', null, { email: email, erro: error.message }, req.ip);
        return res.status(400).json({ 
            success: false,
            message: error.message
        });
    }
    
}

async function register(req, res) {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ 
            success: false,
            message: 'Nome, email e senha sao obrigatorios' 
        });
    }
    try {
        const result = await registerService(name, email, password);
        res.status(201).json({ 
            success: true,
            data: result
        });
    } catch (error) {
        
        res.status(400).json({ 
            success: false,
            message: error.message
        });
    }
    
}


module.exports = {
    login,
    register
};