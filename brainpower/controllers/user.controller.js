// Models
const User = require('../models/user.model');

// Common response handler
const errorHandler = require('../middleware/errorHandler');
const responseHandler = require('../middleware/responseHandler');

const updateUserController = async (req, res) => {
    try {

    } catch (error) {
        console.log("Error while updating user: ", error);
        return errorHandler(res)(error);
    }
}

const updateProfileController = async (req, res) => {
    try {

    } catch (error) {
        console.log("Error while updating user profile: ", error);
        return errorHandler(res)(error);
    }
}

module.exports = { updateUserController, updateProfileController };
