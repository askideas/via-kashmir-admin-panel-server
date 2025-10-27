const jwt = require('jsonwebtoken');

/**
 * Generate access token using client credentials
 */
const generateToken = (req, res) => {
    try {
        const { clientId } = req;

        // Token payload
        const payload = {
            clientId: clientId,
            type: 'access_token'
        };

        // Generate JWT token
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { 
                expiresIn: process.env.TOKEN_EXPIRY || '1h',
                issuer: 'via-kashmir-admin-server',
                audience: clientId
            }
        );

        // Calculate expiry time
        const expiresIn = process.env.TOKEN_EXPIRY || '1h';
        const expiryTime = new Date();
        
        // Parse expiry time (supports formats like 1h, 30m, 24h, etc.)
        if (expiresIn.includes('h')) {
            const hours = parseInt(expiresIn.replace('h', ''));
            expiryTime.setHours(expiryTime.getHours() + hours);
        } else if (expiresIn.includes('m')) {
            const minutes = parseInt(expiresIn.replace('m', ''));
            expiryTime.setMinutes(expiryTime.getMinutes() + minutes);
        } else if (expiresIn.includes('d')) {
            const days = parseInt(expiresIn.replace('d', ''));
            expiryTime.setDate(expiryTime.getDate() + days);
        }

        res.status(200).json({
            success: true,
            message: 'Token generated successfully',
            data: {
                access_token: token,
                token_type: 'Bearer',
                expires_in: expiresIn,
                expires_at: expiryTime.toISOString(),
                client_id: clientId,
                scope: 'admin_access'
            }
        });

    } catch (error) {
        console.error('Token generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate token',
            error: 'TOKEN_GENERATION_ERROR'
        });
    }
};

/**
 * Validate existing token (optional endpoint for checking token validity)
 */
const validateToken = (req, res) => {
    try {
        // If we reach here, token is valid (middleware already verified it)
        const { client } = req;
        
        const expiryDate = new Date(client.exp * 1000);
        const currentTime = new Date();
        const timeUntilExpiry = Math.floor((expiryDate - currentTime) / 1000);

        res.status(200).json({
            success: true,
            message: 'Token is valid',
            data: {
                client_id: client.clientId,
                issued_at: new Date(client.iat * 1000).toISOString(),
                expires_at: expiryDate.toISOString(),
                seconds_until_expiry: timeUntilExpiry,
                is_expired: timeUntilExpiry <= 0
            }
        });

    } catch (error) {
        console.error('Token validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate token',
            error: 'TOKEN_VALIDATION_ERROR'
        });
    }
};

module.exports = {
    generateToken,
    validateToken
};