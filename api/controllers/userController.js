const {loginService, registerService, resetPasswordService, confirmResetService } = require('../services/userService.js');
const { logError, logWarn, logInfo, log } = require('../services/logService');

async function login(req, res) {
    const { email, password } = req.body;
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress;

    if (!email || !password) {
        return res.status(400).json({ 
            success: false,
            message: 'Email e senha sao obrigatorios' 
        });
    }

    try {
        const result = await loginService(email, password);

        await logInfo('Login realizado com sucesso', 'auth', result.id, { email: email }, ip);
        return res.status(200).json({ 
            success: true,
            result 
        });
        
    } catch (error) {
        await logWarn('Falha na tentativa de login', 'auth', null, { email: email, erro: error.message }, ip);
        return res.status(400).json({ 
            success: false,
            message: error.message
        });
    }
    
}

async function register(req, res) {
    const { name, email, password } = req.body;
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress;

    if (!name || !email || !password) {
        return res.status(400).json({ 
            success: false,
            message: 'Nome, email e senha sao obrigatorios' 
        });
    }
    try {
        const result = await registerService(name, email, password);
        return res.status(201).json({ 
            success: true,
            data: result
        });
    } catch (error) {
        logError('Erro ao tentar cadastrar', 'cadastro', null, { email: email, erro: error.message }, ip)
        return res.status(400).json({ 
            success: false,
            message: error.message
        });
    }
    
}

async function reset_pass(req, res) {
    const { email } = req.body;
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress;
    
    if(!email) throw new Error("E-mail obrigatorio");
    try {

        const result = await resetPasswordService(email);
        
        if(!result) throw new Error("Erro ao enviar email de redefinição");

        return res.status(200).json({
            success: true,
            message: "E-mail de redefinição enviado!"
        })
    } catch (error) {

        logError('Erro ao redefinir senha', 'reset-pass', null, { email: email, erro: error.message }, ip);

        return res.status(500).json({ 
            success: false,
            message: error.message
        });
    }
}

async function confirmReset(req, res) {
    const {token, password} = req.body;
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress;

    if(!token || !password){
        return res.status(400).json({
            success: false,
            message: "Dados incompletos."
        })
    }

    try {

        const result = await confirmResetService(token, password);

        if(!result) throw new Error("Erro de redefinição");

        return res.status(200).json({
            success: true,
            message: "Senha redefinida com sucesso!"
        })
        
    } catch (error) {
        logError('Erro ao Confirmar redefinição', 'reset-pass', null, { token: token, erro: error.message }, ip);
        //console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


module.exports = {
    login,
    register,
    reset_pass,
    confirmReset
};