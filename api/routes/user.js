const express = require('express');
const {login, register, reset_pass, confirmReset} = require('../controllers/userController');

const router = express.Router();


router.post('/login', login);
router.post('/register', register);
router.post('/reset-password', reset_pass);
router.post('/confirmReset', confirmReset);


module.exports = router;