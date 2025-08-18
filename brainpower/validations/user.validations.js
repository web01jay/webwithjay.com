const Joi = require('joi');
const { validateRequest } = require('../middleware/requestValidator');

const userUpdateSchema = function (req, res, next) {
    const schema = Joi.object({
        firstName: Joi.string().min(2).max(50).optional(),
        lastName: Joi.string().min(2).max(50).optional(),
        phone: Joi.number().min(10).max(10).required()
    });
    validateRequest(req, res, next, schema, req.body);
}

const updateProfile = function (req, res, next) {
    const schema = Joi.object({
        profile: Joi.any().required()
    });
    validateRequest(req, res, next, schema, req.body);
}

module.exports = { userUpdateSchema, updateProfile };
