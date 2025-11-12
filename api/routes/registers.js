const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { getRegistros, setRegistro } = require('../controllers/registerController');


const router = express.Router();

router.post('/',    authMiddleware, getRegistros);
router.post('/cad', authMiddleware, setRegistro);

module.exports = router;