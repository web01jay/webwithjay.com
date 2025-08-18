const express = require('express');
const router = express.Router();

// Validations
const { userUpdateSchema, updateProfile } = require('../validations/user.validations');

// Controller
const { updateUserController, updateProfileController } = require('../controllers/user.controller');

router.patch('/update', userUpdateSchema, updateUserController);
router.patch('/update-profile', updateProfile, updateProfileController);

module.exports = router;
