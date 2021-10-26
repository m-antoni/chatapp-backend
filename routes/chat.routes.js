const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chat.controller');

// URL: api/
router.post('/login', ChatController.login);


module.exports = router;