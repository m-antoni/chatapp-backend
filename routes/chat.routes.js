const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chat.controller');

// URL: api/
router.get('/:id', ChatController.get_all_messages);
router.post('/login', ChatController.login);


module.exports = router;