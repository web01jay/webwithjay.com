/**
    File: middleware/responseHandler.js
    This middleware handles the response formatting for the application.
    It standardizes the response structure for both success and error cases.
    It can be used across different routes to ensure consistency in API responses.
    Usage: Import this middleware and use it in your route handlers to send responses.

    Example:
    import responseHandler from './middleware/responseHandler.js';
    import express from 'express';
    const router = express.Router();
    router.get('/example', (req, res) => {
    responseHandler(res, true, 200, 'Request successful', { exampleData: 'data' });
    });
*/

const responseHandler = (res, isOk = true, status = 200, message = 'ok', data = {}, error = {}) => {
    res.status(status).json({
        success: isOk,
        message,
        data,
        error
    });
};

module.exports = responseHandler;
