const {logInfo, logError} = require('../services/logService');
const { getRegistrosService, setRegistroService } = require('../services/registerService');
const { salvarSaldoMensal, getSaldosService, updateSaldoService, updateSaldoPgService } = require('../services/saldoService');

async function fecharMes(req, res) {
    const token = req.headers['authorization'].split(' ')[1];

    // Decodifica o token para obter o userId
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    if(!userId || userId <= 0 || isNaN(userId)) {
        return res.status(400).json({ 
            success: false,
            message: 'ID do usuario nao encontrado no token' 
        });
    }

    const {periodo} = req.body


    if(!periodo){
        return res.status(400).json({ 
            success: false,
            message: 'Periodo não informado.' 
        });
    }
    try {
        const resultado = await getRegistrosService(userId, periodo);

        const saldoSys = resultado.saldoPeriodo;
        const saldo100 = resultado.registros.reduce((acc, r) => acc + r.saldo_100, 0);

        //console.log(resultado);
        //console.log("saldoSys: ", saldoSys, "Saldo100: ", saldo100);

        const save = await salvarSaldoMensal(
            userId,
            resultado.dt_fim, // data de fechamento usada como período
            saldoSys,
            saldo100
        );

        if(!save) throw new Error('Erro ao salvar saldo');

        return res.status(200).json({
            success: true,
            message: "Saldo salvo!"
        })

        
    } catch (error) {
        const forwarded = req.headers["x-forwarded-for"];
        const ip = forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress;
        await logError('Falha ao salvar saldo', 'saldos', userId, { body: req.body,  erro: error.message }, ip);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
    

}

async function getSaldo(req, res) {
    const token = req.headers['authorization'].split(' ')[1];

    // Decodifica o token para obter o userId
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    if(!userId || userId <= 0 || isNaN(userId)) {
        return res.status(400).json({ 
            success: false,
            message: 'ID do usuario nao encontrado no token' 
        });
    }

    try {

        
    } catch (error) {
        const forwarded = req.headers["x-forwarded-for"];
        const ip = forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress;
        await logError('Falha ao carregar saldo', 'saldos', userId, { erro: error.message }, ip);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

async function getSaldos(req, res) {
    const token = req.headers['authorization'].split(' ')[1];

    // Decodifica o token para obter o userId
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    if(!userId || userId <= 0 || isNaN(userId)) {
        return res.status(400).json({ 
            success: false,
            message: 'ID do usuario nao encontrado no token' 
        });
    }

    const { ano } = req.body;

    if(!ano){
        return res.status(400).json({
            success: false,
            message: "Ano é obrigatorio"
        });
    }

    try {
        
        const result = await getSaldosService(userId, ano);

        if(!result) throw new Error('Erro ao carregar saldos');

        return res.status(200).json({
            success: true,
            saldos: result
        });

    } catch (error) {
        const forwarded = req.headers["x-forwarded-for"];
        const ip = forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress;
        logError('Falha ao carregar saldos', 'saldos', userId, { erro: error.message }, ip);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

async function updateSaldo(req, res) {
    const token = req.headers['authorization'].split(' ')[1];

    // Decodifica o token para obter o userId
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    if(!userId || userId <= 0 || isNaN(userId)) {
        return res.status(400).json({ 
            success: false,
            message: 'ID do usuario nao encontrado no token' 
        });
    }

    try {
        const {periodo, saldo, obs} = req.body;

        if(!periodo || saldo == null ){
            return res.status(400).json({
                success: false,
                message: "Dados incompletos!"
            })
        }

        const result = await updateSaldoService(userId, periodo, saldo, obs);

        if(!result) throw new Error('Erro ao atualizar saldo');

        return res.status(200).json({
            success: true,
            message: "Saldo atualizado com sucesso"
        });

    } catch (error) {
        const forwarded = req.headers["x-forwarded-for"];
        const ip = forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress;
        logError('Falha ao atualizar o saldo', 'saldos', userId, { body: req.body, erro: error.message }, ip);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }

}

async function updateSaldoPg(req, res) {

    const token = req.headers['authorization'].split(' ')[1];

    // Decodifica o token para obter o userId
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    if(!userId || userId <= 0 || isNaN(userId)) {
        return res.status(400).json({ 
            success: false,
            message: 'ID do usuario nao encontrado no token' 
        });
    }

    const {periodo, value} = req.body


    if(!periodo){
        return res.status(400).json({ 
            success: false,
            message: 'Periodo não informado.' 
        });
    }
    
    try {
        const result = await updateSaldoPgService(userId, periodo, value);

        if(!result) throw new Error('Erro ao atualizar pg 100%');

        return res.status(200).json({
            success: true,
            message: "Pagemento de 100% registrado."
        })
        
    } catch (error) {
        const forwarded = req.headers["x-forwarded-for"];
        const ip = forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress;
        logError('Falha ao atualizar o pagamento de 100%', 'saldos', userId, { body: req.body, erro: error.message }, ip);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    getSaldo,
    fecharMes,
    getSaldos,
    updateSaldo,
    updateSaldoPg
}