const { configsService, updateConfigs } = require('../services/configService');
const { logError } = require('../services/logService');

async function getConfig(req, res) {
    const config = (req.url).replace('/', '');

    if(config == '' || config == null || !config) {
        return res.status(400).json({ 
            success: false,
            message: 'Configuraçao nao especificada' 
        });
    }

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
        if(config == "update"){
            const {conf, nominal} = req.body;

            if(!conf || !nominal){
                return res.status(400).json({ 
                    success: false,
                    message: 'Configuraçao nao especificada' 
                });
            }

            const result = await updateConfigs(userId, conf, nominal);

            if (!result) throw new Error('Erro atualizar configurações');

            return res.status(200).json({
                success: true,
                message: 'Configurações Atualizadas'
            })
        }else{
            const configValue = await configsService(userId, config);

            return res.status(200).json({ 
                success: true,
                data: configValue 
            });
        }
    } catch (error) {
        const forwarded = req.headers["x-forwarded-for"];
        const ip = forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress;

        await logError('Falha ao carregar configuraçao', 'config', userId, { config, erro: error.message }, ip);
        return res.status(500).json({ 
            success: false,
            message: error.message
        });
    }
    
}

module.exports = {
    getConfig
};