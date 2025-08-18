
const apiAuth = require("../models/apiAuth.model");
const responseHandler = require("./responseHandler");
/**
 * Middleware to check API access key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
// This middleware checks if the request contains a valid API access key in the headers.
// If the key is valid, it allows the request to proceed to the next middleware or route handler.
// If the key is missing or invalid, it responds with a 401 Unauthorized status and an error message.
// It retrieves the access key from the database based on the server environment (development or production).
// The access key is expected to be present in the request headers under the key "auth".
// The server environment is determined by the NODE_ENV environment variable, defaulting to "dev"
// if not set. The access key is compared against the one stored in the database, and if they match, the request is allowed to proceed.
// If an error occurs during the process, a 500 Internal Server Error response is sent back to the client.


exports.apiAccess = async (req, res, next) => {
	try {
		console.log('User ', req.user);
		let token = req?.headers?.["auth"];
		if (!token) {
			return responseHandler(res, false, 401, "Missing APIs access key.");
		}
		let serverEnv = process.env.NODE_ENV || "dev";

		let data = await apiAuth.findOne({ serverEnv, isActive: 1 }, { accessKey: 1 });
		if (data.accessKey === token) {
			next();
		} else {
			return responseHandler(res, false, 401, "Invalid APIs access key.");
		}
	} catch (error) {
		console.log("access key error", error);
		return responseHandler(res, false, 500, "Server Error.");
	}
};
