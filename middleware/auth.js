const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT tokens
 * Expects Authorization header with Bearer token
 */
const verifyToken = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided or invalid format. Use Bearer token.',
                error: 'MISSING_TOKEN'
            });
        }

        // Extract token from "Bearer <token>"
        const token = authHeader.substring(7);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Token is empty.',
                error: 'EMPTY_TOKEN'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add client info to request object
        req.client = {
            clientId: decoded.clientId,
            iat: decoded.iat,
            exp: decoded.exp
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.',
                error: 'INVALID_TOKEN'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired. Please generate a new token.',
                error: 'TOKEN_EXPIRED'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Token verification failed.',
            error: 'TOKEN_VERIFICATION_ERROR'
        });
    }
};

/**
 * Middleware to verify client credentials for token generation
 */
const verifyClientCredentials = (req, res, next) => {
    try {
        const { client_id, client_secret } = req.body;

        if (!client_id || !client_secret) {
            return res.status(400).json({
                success: false,
                message: 'Missing client credentials. Both client_id and client_secret are required.',
                error: 'MISSING_CREDENTIALS'
            });
        }

        // Verify against environment variables
        if (client_id !== process.env.CLIENT_ID || client_secret !== process.env.CLIENT_SECRET) {
            return res.status(401).json({
                success: false,
                message: 'Invalid client credentials.',
                error: 'INVALID_CREDENTIALS'
            });
        }

        // Add client_id to request for token generation
        req.clientId = client_id;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Client credential verification failed.',
            error: 'CREDENTIAL_VERIFICATION_ERROR'
        });
    }
};

module.exports = {
    verifyToken,
    verifyClientCredentials
};