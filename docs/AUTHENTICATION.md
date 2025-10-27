# Via Kashmir Admin Server - Authentication Documentation

## Overview
This API now uses OAuth2-style client credentials flow for authentication. All API endpoints (except authentication endpoints) require a valid Bearer token.

## Authentication Flow

### Step 1: Generate Access Token

**Endpoint:** `POST /auth/token`

**Request:**
```json
{
    "client_id": "via_kashmir",
    "client_secret": "3f7b2vc8e-f9e8-4di3e-9d25-9eaafc7e9871awdfu6389987ybdowhksdfh78309374jnfdsfkutwuqe"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Token generated successfully",
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "token_type": "Bearer",
        "expires_in": "1h",
        "expires_at": "2024-10-27T15:30:00.000Z",
        "client_id": "via_kashmir",
        "scope": "admin_access"
    }
}
```

### Step 2: Use Access Token for API Calls

Include the token in the Authorization header for all subsequent API calls:

```
Authorization: Bearer <your_access_token>
```

## Protected Endpoints

All the following endpoints now require authentication:

### Categories
- `GET /categories` - Get all categories
- `GET /categories/:id` - Get category by ID
- `POST /categories` - Create new category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

### Employees
- `POST /employees` - Add new employee
- All other employee endpoints

## Example Usage

### 1. Get Access Token
```bash
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "via_kashmir",
    "client_secret": "3f7b2vc8e-f9e8-4di3e-9d25-9eaafc7e9871awdfu6389987ybdowhksdfh78309374jnfdsfkutwuqe"
  }'
```

### 2. Use Token to Access Protected Endpoint
```bash
curl -X GET http://localhost:3000/categories \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Validate Token (Optional)
```bash
curl -X GET http://localhost:3000/auth/validate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Additional Authentication Endpoints

### Get Authentication Info
**Endpoint:** `GET /auth/info`
- Returns comprehensive information about authentication endpoints and usage
- Does not require authentication

### Validate Token
**Endpoint:** `GET /auth/validate`
- Validates the current token and returns token information
- Requires Bearer token in Authorization header

## Error Responses

### Missing Token
```json
{
    "success": false,
    "message": "Access denied. No token provided or invalid format. Use Bearer token.",
    "error": "MISSING_TOKEN"
}
```

### Invalid Token
```json
{
    "success": false,
    "message": "Invalid token.",
    "error": "INVALID_TOKEN"
}
```

### Expired Token
```json
{
    "success": false,
    "message": "Token has expired. Please generate a new token.",
    "error": "TOKEN_EXPIRED"
}
```

### Invalid Credentials
```json
{
    "success": false,
    "message": "Invalid client credentials.",
    "error": "INVALID_CREDENTIALS"
}
```

## Configuration

The following environment variables control the authentication system:

```env
# OAuth2 Client Configuration
CLIENT_ID=via_kashmir
CLIENT_SECRET=3f7b2vc8e-f9e8-4di3e-9d25-9eaafc7e9871awdfu6389987ybdowhksdfh78309374jnfdsfkutwuqe

# JWT Configuration
JWT_SECRET=yG7v9K8mQefdghsdfh56745vhdfhhbqbgkcbWz3fVt2iLr0aSx7bHknYqC4da6fT1uZ0A
TOKEN_EXPIRY=1h
```

## Security Features

1. **JWT Tokens**: Secure JSON Web Tokens with configurable expiry
2. **Client Credential Verification**: Server validates client_id and client_secret
3. **Bearer Token Authentication**: Standard OAuth2 Bearer token format
4. **Token Expiry**: Configurable token expiration (default: 1 hour)
5. **Comprehensive Error Handling**: Detailed error messages for debugging
6. **Middleware Protection**: All sensitive endpoints are protected by authentication middleware

## Testing with Postman

1. **Generate Token:**
   - Method: POST
   - URL: `http://localhost:3000/auth/token`
   - Body (raw JSON):
     ```json
     {
         "client_id": "via_kashmir",
         "client_secret": "3f7b2vc8e-f9e8-4di3e-9d25-9eaafc7e9871awdfu6389987ybdowhksdfh78309374jnfdsfkutwuqe"
     }
     ```

2. **Use Token:**
   - Method: GET/POST/PUT/DELETE
   - URL: `http://localhost:3000/categories` (or any protected endpoint)
   - Headers:
     - Key: `Authorization`
     - Value: `Bearer <your_token_from_step_1>`

## Token Lifespan

- Default: 1 hour
- Configurable via `TOKEN_EXPIRY` environment variable
- Supports formats: `1h`, `30m`, `24h`, `1d`
- Tokens automatically expire and require regeneration