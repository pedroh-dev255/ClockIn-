const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

const {getSaldos, getSaldo, fecharMes, updateSaldo, updateSaldoPg} = require('../controllers/saldoController');

const router = express.Router();


router.post('/getSaldo', authMiddleware,  getSaldo);
router.post('/getSaldos', authMiddleware,  getSaldos);
router.post('/setSaldo', authMiddleware, fecharMes);
router.post('/updateSaldo', authMiddleware, updateSaldo);
router.post('/updateSaldoPg', authMiddleware, updateSaldoPg);


module.exports = router;