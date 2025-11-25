const { getRegistrosService, setRegistroService } = require('../services/registerService');
const { logError, logInfo } = require('../services/logService');


async function getRegistros(req, res) {
    const { periodo } = req.body;

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
        const registros = await getRegistrosService(userId, periodo);
        return res.status(200).json({ 
            success: true,
            data: registros 
        });
    } catch (error) {

        const forwarded = req.headers["x-forwarded-for"];
        const ip = forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress;

        await logError('Falha ao carregar registros', 'registros', userId, { erro: error.message }, ip);

        return res.status(500).json({ 
            success: false,
            message: error.message
        });
    }
    
}

async function setRegistro(req, res) {
    const { data, coluna, value } = req.body;

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

    if(!data || !coluna){
        return res.status(400).json({ 
            success: false,
            message: 'Preencha todos os campos!' 
        });
    }

    try {
        const result =  await setRegistroService(userId, data, coluna, value);
        
        return res.status(200).json({ 
            success: true,
            result
        });
    } catch(error){
        const forwarded = req.headers["x-forwarded-for"];
        const ip = forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress;
        await logError('Falha ao cadastrar registro', 'registros', userId, { erro: error.message }, ip);

        return res.status(500).json({ 
            success: false,
            message: error.message
        });
    }
    
}



module.exports = {
    getRegistros,
    setRegistro
};
