const pool = require('../configs/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();


async function loginService(email, password) {
    //console.log("loginService chamado com:", email, password);
    try {
        const [rows] = await pool.promise().query(
            'SELECT id, email, password FROM users WHERE email = ?',
            [email]
        );
        if (rows.length === 0) {
            throw new Error('Email ou senha invalidos');
        }

        //console.log("Usuario encontrado:", rows[0]);

        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            throw new Error('Email ou senha invalidos');
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        await cadLoginToken(token, user.id);

        return { id: user.id, email: user.email, token };

    } catch (error) {
        throw new Error(error.message);
    }
}

async function registerService(name, email, password) {
    const connection = await pool.promise().getConnection();

    try {
        await connection.beginTransaction();

        const [existingUser] = await connection.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        if (existingUser.length > 0) {
            throw new Error('Email já cadastrado');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await connection.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        const userId = result.insertId;

        const token = jwt.sign(
            { id: userId, email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // cadastra o token de login
        const result_token = await cadLoginToken(token, userId, connection);

        if (!result_token) {
            throw new Error('Erro ao cadastrar token de login');
        }

        // cadastro de informações nominais para usuario.

        //horairos nominais:
        const nominals = await connection.query(`
            INSERT INTO nominals (user_id, dia_semana, hora1, hora2, hora3, hora4, hora5, hora6) VALUES
                (?, 'Domingo', NULL, NULL, NULL, NULL, NULL, NULL),
                (?, 'Segunda', '08:00', '12:00', '14:00', '18:00', NULL, NULL),
                (?, 'Terça',   '08:00', '12:00', '14:00', '18:00', NULL, NULL),
                (?, 'Quarta',  '08:00', '12:00', '14:00', '18:00', NULL, NULL),
                (?, 'Quinta',  '08:00', '12:00', '14:00', '18:00', NULL, NULL),
                (?, 'Sexta',   '08:00', '12:00', '14:00', '18:00', NULL, NULL),
                (?, 'Sábado',  '08:00', '12:00', NULL, NULL, NULL, NULL)`,
            [userId, userId, userId, userId, userId, userId, userId]
        );

        if (!nominals) {
            throw new Error('Erro ao cadastrar horarios nominais');
        }

        const configs = await connection.query(`
            INSERT INTO configs (user_id, config_key, config_value) VALUES
                (?, 'toleranciaPonto', '5'),
                (?, 'toleranciaGeral', '10'),
                (?, 'maximo50', '180'),
                (?, 'fechamento_mes', '25')`,
            [userId, userId, userId, userId]
        );

        if (!configs) {
            throw new Error('Erro ao cadastrar configuracoes iniciais');
        }

        //-------------------------------------------------------------//

        await connection.commit();

        return { id: userId, name, email, token };

    } catch (error) {
        
        await connection.rollback();
        throw new Error(error.message);
    } finally {
        connection.release();
    }
}


async function cadLoginToken(token, userId, connection = null) {
    try {
        const conn = connection || pool.promise(); // usa conexão da transação se houver
        const [result] = await conn.query(
            'INSERT INTO logins (token, user_id) VALUES (?, ?)',
            [token, userId]
        );
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

async function getLoginToken(userId, token) {
    try {
        const [rows] = await pool.promise().query(
            'SELECT token FROM login_tokens WHERE user_id = ? OR token = ? ORDER BY created_at DESC LIMIT 1',
            [userId, token]
        );
        if (rows.length === 0) {
            return null;
        }
        return rows[0].token;
    } catch (error) {
        throw new Error(error.message);
    }
    
}

async function deleteLoginToken(userId, token) {
    try {
        const [result] = await pool.promise().query(
            'DELETE FROM login_tokens WHERE user_id = ? OR token = ?',
            [userId, token]
        );
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = {
    loginService,
    registerService
};