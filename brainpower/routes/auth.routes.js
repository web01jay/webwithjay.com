const express = require('express');
const { loginUser, signupUser } = require('../controllers/auth.controller');
const { validateSignup, validateLogin } = require('../validations/auth.validations');

const router = express.Router();

router.post('/signup', validateSignup, signupUser);
router.post('/login', validateLogin, loginUser);

module.exports = router;
