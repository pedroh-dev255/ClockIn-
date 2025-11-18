const pool = require('../configs/db');
const sendMail = require("../configs/mailer");
const { v4: uuidv4 } = require('uuid');
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

        const [admin] = await pool.promise().query('select * from admins where user_id = ?', [user.id])
        let role = 'user';
        
        if (admin.length > 0) {
            role = 'admin';
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        await cadLoginToken(token, user.id);

        return { id: user.id, email: user.email, role, token };

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

        let role = 'user';
        

        const token = jwt.sign(
            { id: userId, email, role },
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

        return { id: userId, name, email, role, token };

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


async function resetPasswordService(email) {
    let connection;

    try {
        const [users] = await pool.promise().query(
            'SELECT id, name, email FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            throw new Error("E-mail não cadastrado!");
        }

        const user = users[0];

        // Gerar token
        const resetToken = uuidv4().split("-")[0];
        const expiresAt = new Date(Date.now() + 3600000); // 1 hora

        connection = await pool.promise().getConnection();
        await connection.beginTransaction();

        // Gravar token no banco
        await connection.query(
            `INSERT INTO reset_password (user_id, resetToken, expires_at) VALUES (?, ?, ?)`,
            [user.id, resetToken, expiresAt]
        );

        // Corpo do e-mail
        const title = 'Redefinição de Senha';
        const body = `
            <div style="
                width: 100%;
                background: #f3f3f3;
                padding: 40px 0;
                font-family: Arial, sans-serif;
            ">

                <div style="
                    max-width: 500px;
                    background: #fff;
                    margin: auto;
                    border-radius: 14px;
                    padding: 30px 25px;
                    box-shadow: 0 4px 14px rgba(0,0,0,0.08);
                ">
                
                <h1 style="
                    text-align: center;
                    color: #6A3EED;
                    margin: 0 0 5px 0;
                    font-size: 28px;
                ">
                    ClockIn!
                </h1>

                <h2 style="
                    text-align: center;
                    color: #333;
                    font-size: 18px;
                    font-weight: 600;
                    margin-top: 0;
                ">
                    Redefinição de Senha
                </h2>

                <p style="
                    color: #555;
                    font-size: 15px;
                    line-height: 1.6;
                ">
                    Olá <strong>${user.name}</strong>,
                </p>

                <p style="
                    color: #555;
                    font-size: 15px;
                    line-height: 1.6;
                ">
                    Recebemos uma solicitação para redefinir sua senha.  
                    Para continuar, use o botão abaixo.  
                    <br><br>
                    Este link expira em <strong>1 hora</strong>.
                </p>

                <!-- BOTÃO -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL}/redefinir-senha/confirmacao/?token=${resetToken}"
                    style="
                        background: #6A3EED;
                        color: #fff;
                        padding: 14px 22px;
                        text-decoration: none;
                        font-weight: bold;
                        border-radius: 10px;
                        display: inline-block;
                        font-size: 16px;
                        letter-spacing: 0.5px;
                        box-shadow: 0 3px 10px rgba(106,62,237,0.3);
                        transition: 0.2s ease;
                    ">
                        Redefinir Senha
                    </a>
                </div>

                <p style="
                    color: #555;
                    text-align: center;
                    font-size: 14px;
                    margin-top: 20px;
                ">
                    Caso o botão não funcione, copie e cole o link abaixo no navegador:
                </p>

                <!-- LINK RAW -->
                <p style="
                    word-break: break-all;
                    text-align: center;
                    font-size: 12px;
                    color: #6A3EED;
                ">
                    ${process.env.FRONTEND_URL}/redefinir-senha/confirmacao/?token=${resetToken}
                </p>

                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">

                <p style="
                    font-size: 13px;
                    color: #888;
                    text-align: center;
                ">
                    Se você não solicitou essa alteração, apenas ignore este e-mail.<br>
                    <strong>Equipe ClockIn!</strong>
                </p>

                </div>

            </div>
            `;


        const emailEnviado = await sendMail(email, title, body);

        if (!emailEnviado) {
            throw new Error("Falha ao enviar e-mail");
        }

        await connection.commit();

        return true;

    } catch (error) {
        if (connection) await connection.rollback();
        throw new Error(error.message);

    } finally {
        if (connection) connection.release();
    }
}


async function confirmResetService(token, password) {
   let connection;

    try {
        connection = await pool.promise().getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.query(
            "SELECT * FROM reset_password WHERE resetToken = ?",
            [token]
        );

        if (rows.length === 0) {
            throw new Error("Token inválido ou não encontrado");
        }

        const resetData = rows[0];

        const agora = new Date();
        if (agora > resetData.expires_at) {
            throw new Error("Token expirado, solicite uma nova redefinição");
        }

        const hashed = await bcrypt.hash(password, 10);

        await connection.query(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashed, resetData.user_id]
        );

        await connection.query(
            "DELETE FROM reset_password WHERE resetToken = ?",
            [token]
        );

        await connection.commit();

        return true;

    } catch (error) {
        if (connection) await connection.rollback();
        throw new Error(error.message);
    } finally {
        if (connection) connection.release();
    }
}

async function adminService(req, res) {
    
}

module.exports = {
    loginService,
    registerService,
    resetPasswordService,
    confirmResetService,
    adminService
};