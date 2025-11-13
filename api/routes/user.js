const express = require('express');
const {login, register, reset_pass} = require('../controllers/userController');

const router = express.Router();


router.post('/login', login);
router.post('/register', register);
router.post('/reset-password', reset_pass);


module.exports = router;