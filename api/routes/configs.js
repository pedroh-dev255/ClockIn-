const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { getConfig } = require('../controllers/configController');

const router = express.Router();

router.use(authMiddleware, getConfig);

module.exports = router;
