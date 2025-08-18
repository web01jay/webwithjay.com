const Joi = require('joi');
const { validateRequest } = require('../middleware/requestValidator');

const adminvalidateLogin = function (req, res, next) {
  const schema = Joi.object({
   Email: Joi.string().trim().email().required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Email must be in a valid form'
      }),
    Password: Joi.string().trim().required()
      .messages({
        'string.empty': 'Password is required'
      }),
    Code: Joi.string().trim()
  })
  validateRequest(req, res, next, schema, req.body);
}

const validateSignup = function (req, res, next) {
    const schema = Joi.object({
      firstName: Joi.string().min(2).max(50).required(),
      lastName: Joi.string().min(2).max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).max(128).required(),
      phone: Joi.string().min(10).max(10).required(),
      gender: Joi.string().allow('male', 'female').required()
    });
    validateRequest(req, res, next, schema, req.body);
}

const validateLogin = function (req, res, next) {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).max(128).required()
    });
    validateRequest(req, res, next, schema, req.body);
}

module.exports = {
  validateSignup,
  validateLogin
};
