const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const { errorHandler } = require('../middleware/errorHandler');
const responseHandler = require('../middleware/responseHandler');

const signupUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, gender } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return responseHandler(res, false, 409, 'User already exists');
        }
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // Create user
        const user = await User.create({ firstName, lastName, email, phone, gender, password: hashedPassword });
        return responseHandler(res, true, 201, 'User signed up successfully', { user: { name: user.Name, email: user.Email } });
    } catch (err) {
        console.error('Error during signup:', err);
        return errorHandler(res)(err);
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email: email }).lean();
        if (!user) {
            return responseHandler(res, false, 401, 'Invalid credentials 1');
        }
        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return responseHandler(res, false, 401, 'Invalid credentials 2');
        }
        // Store login details in session and pass in req.user
        req.session = req.session || {};
        req.session.user = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            gender: user.gender
        };
        req.user = req.session.user;
        return responseHandler(res, true, 200, 'User logged in successfully', { user: req.user });
    } catch (err) {
        console.error('Error during login:', err);
        return errorHandler(res)(err);
    }
};

module.exports = {
    signupUser,
    loginUser
};
