const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

//rotas
const userRoutes = require('./routes/user');
const registerRoutes = require('./routes/registers');
const configRoutes = require('./routes/configs');

//middleware
const tokenMiddleware = require('./middlewares/tokenMiddleware');
const logMiddleware = require('./middlewares/logMiddleware');
const authMiddleware = require('./middlewares/authMiddleware');

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

app.use('/api/users', tokenMiddleware, logMiddleware, userRoutes);
app.use('/api/configs', tokenMiddleware, logMiddleware, configRoutes);
app.use('/api/registers', tokenMiddleware, logMiddleware, registerRoutes);
app.use('/api/configs', tokenMiddleware, logMiddleware, configRoutes);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/`);
});
