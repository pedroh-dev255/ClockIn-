const { configsService } = require('../services/configService');
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
        const configValue = await configsService(userId, config);

        return res.status(200).json({ 
            success: true,
            data: configValue 
        });
    } catch (error) {

        await logError('Falha ao carregar configuraçao', 'config', userId, { config, erro: error.message }, req.ip);
        return res.status(500).json({ 
            success: false,
            message: error.message
        });
    }
    
}

module.exports = {
    getConfig
};