const express = require('express');
const { generateToken, validateToken } = require('../controllers/authController');
const { verifyClientCredentials, verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /auth/token
 * Generate access token using client credentials
 * 
 * Body Parameters:
 * - client_id: Your client identifier
 * - client_secret: Your client secret
 */
router.post('/token', verifyClientCredentials, generateToken);

/**
 * GET /auth/validate
 * Validate current token (requires Bearer token)
 * 
 * Headers:
 * - Authorization: Bearer <your_token>
 */
router.get('/validate', verifyToken, validateToken);

/**
 * GET /auth/info
 * Get authentication information and usage instructions
 */
router.get('/info', (req, res) => {
    res.json({
        success: true,
        message: 'Via Kashmir Admin Server Authentication',
        endpoints: {
            token_generation: {
                method: 'POST',
                url: '/auth/token',
                description: 'Generate access token using client credentials',
                body: {
                    client_id: 'your_client_id',
                    client_secret: 'your_client_secret'
                },
                response: {
                    access_token: 'jwt_token_here',
                    token_type: 'Bearer',
                    expires_in: '1h'
                }
            },
            token_validation: {
                method: 'GET',
                url: '/auth/validate',
                description: 'Validate current token',
                headers: {
                    Authorization: 'Bearer <your_token>'
                }
            },
            protected_endpoints: [
                '/categories (all methods)',
                '/employees (all methods)'
            ]
        },
        usage_flow: [
            '1. Generate token using POST /auth/token with client credentials',
            '2. Use the returned access_token in Authorization header',
            '3. Format: Authorization: Bearer <access_token>',
            '4. Access protected endpoints with the token'
        ]
    });
});

module.exports = router;