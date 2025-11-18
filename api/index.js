const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

//rotas
const userRoutes     = require('./routes/user');
const registerRoutes = require('./routes/registers');
const configRoutes   = require('./routes/configs');
const saldoRoutes    = require('./routes/saldos');
const logRoute       = require('./routes/logs');

//middleware
const tokenMiddleware = require('./middlewares/tokenMiddleware');
const logMiddleware   = require('./middlewares/logMiddleware');
const authMiddleware  = require('./middlewares/authMiddleware');


const app = express();
const PORT = process.env.PORT || 3000;

dotenv.config();

app.use(cors({origin: '*'}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Welcome to the Clock In API');
});

app.post('/api/validate-token', tokenMiddleware, authMiddleware, (req, res) => {
    res.json({ success: true, message: 'Token valido' });
});

app.get('/api/validate-token-Admin', tokenMiddleware, authMiddleware, (req, res) => {
    const token = req.headers['authorization'].split(' ')[1];

    // Decodifica o token para obter o userId
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = decoded.role;

    if(!role || role !== 'admin') {
        res.status(400).json({ 
            success: false,
            message: 'ID do usuario nao encontrado no token' 
        });
    }

    res.json({ success: true, role, message: 'Token valido, user admmin' });
});

app.use('/api/users',     tokenMiddleware, logMiddleware, userRoutes);
app.use('/api/configs',   tokenMiddleware, logMiddleware, configRoutes);
app.use('/api/registers', tokenMiddleware, logMiddleware, registerRoutes);
app.use('/api/configs',   tokenMiddleware, logMiddleware, configRoutes);
app.use('/api/saldos',    tokenMiddleware, logMiddleware, saldoRoutes);
app.use('/api/logs',      tokenMiddleware, logMiddleware, logRoute);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/`);
});
