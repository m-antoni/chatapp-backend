const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

/* api route */
router.post('/join-room', messageController.joinRoom);