# Authentication System Documentation

## Overview

Complete JWT-based authentication system with access/refresh token pattern, role-based access control, and comprehensive security features.

---

## 🔐 Components

### 1. **JWT Utilities** (`src/utils/jwt.js`)

JWT token generation and verification utilities.

#### Functions:
- `generateAccessToken(payload)` - Generate short-lived access token (default: 1h)
- `generateRefreshToken(payload)` - Generate long-lived refresh token (default: 7d)
- `verifyAccessToken(token)` - Verify and decode access token
- `verifyRefreshToken(token)` - Verify and decode refresh token
- `generateTokenPair(user)` - Generate both tokens at once

#### Token Payload:
```javascript
{
  userId: string,
  email: string,
  role: string
}
```

---

### 2. **Authentication Middleware** (`src/middleware/auth.js`)

#### `protect`
Protects routes by verifying JWT token in Authorization header.

**Usage:**
```javascript
router.get('/protected-route', protect, controller);
```

**Behavior:**
- Extracts token from `Authorization: Bearer <token>` header
- Verifies token signature and expiration
- Checks if user exists and is active
- Checks if user is blocked
- Attaches user to `req.user`

**Error Responses:**
- `401` - No token, invalid token, or expired token
- `403` - User account is blocked

#### `authorize(...roles)`
Role-based access control middleware.

**Usage:**
```javascript
router.get('/admin-only', protect, authorize('admin', 'org_admin'), controller);
```

**Behavior:**
- Must be used after `protect` middleware
- Checks if user's role is in allowed roles array
- Returns `403` if unauthorized

#### `optionalAuth`
Optional authentication - attaches user if token present, but doesn't require it.

**Usage:**
```javascript
router.get('/public-with-user-context', optionalAuth, controller);
```

---

### 3. **Auth Controller** (`src/controllers/authController.js`)

Business logic for authentication operations.

#### Endpoints:

##### `register`
- **Route**: `POST /api/v1/auth/register`
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890" // optional
  }
  ```
- **Response**: User object + accessToken + refreshToken

##### `login`
- **Route**: `POST /api/v1/auth/login`
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123"
  }
  ```
- **Response**: User object + accessToken + refreshToken

##### `refreshToken`
- **Route**: `POST /api/v1/auth/refresh`
- **Access**: Public
- **Body**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Response**: New accessToken

##### `getMe`
- **Route**: `GET /api/v1/auth/me`
- **Access**: Private (requires `protect` middleware)
- **Response**: Current user profile

##### `updateProfile`
- **Route**: `PUT /api/v1/auth/me`
- **Access**: Private
- **Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "bio": "My bio",
    "avatar": "https://example.com/avatar.jpg"
  }
  ```
- **Response**: Updated user object

##### `updatePassword`
- **Route**: `PUT /api/v1/auth/update-password`
- **Access**: Private
- **Body**:
  ```json
  {
    "currentPassword": "OldPass123",
    "newPassword": "NewSecurePass123"
  }
  ```
- **Response**: Success message

##### `logout`
- **Route**: `POST /api/v1/auth/logout`
- **Access**: Private
- **Note**: Since JWT is stateless, logout is primarily client-side (remove tokens). This endpoint is for logging purposes or future token blacklisting.

---

### 4. **Auth Routes** (`src/routes/auth.js`)

Route definitions with input validation using `express-validator`.

#### Validation Rules:

**Registration:**
- Email: Valid email format
- Password: Min 8 chars, must contain uppercase, lowercase, and number
- First/Last name: Optional, max 50 chars
- Phone: Optional, valid phone format

**Login:**
- Email: Valid email format
- Password: Required

**Profile Update:**
- All fields optional
- Email cannot be changed (security)
- Phone: Valid format
- Bio: Max 500 chars
- Avatar: Valid URL

**Password Update:**
- Current password: Required
- New password: Min 8 chars, must contain uppercase, lowercase, and number

---

## 🔒 Security Features

### 1. **Password Security**
- Bcrypt hashing with 12 salt rounds (in User model pre-save middleware)
- Passwords never returned in API responses
- Password field excluded from queries by default

### 2. **Token Security**
- Access tokens: Short-lived (1 hour default)
- Refresh tokens: Long-lived (7 days default)
- Separate secrets for access and refresh tokens
- Tokens stored securely on client (HttpOnly cookies recommended)

### 3. **Account Protection**
- Active status check on every authenticated request
- Blocked account detection with reason
- Account status validation during login

### 4. **Input Validation**
- All inputs validated with express-validator
- SQL injection prevention (Mongoose handles this)
- XSS prevention (input sanitization)

### 5. **Error Handling**
- Consistent error response format
- No sensitive information leaked in errors
- Proper HTTP status codes

---

## 📡 API Endpoints Summary

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/auth/register` | Public | Register new user |
| POST | `/api/v1/auth/login` | Public | Login user |
| POST | `/api/v1/auth/refresh` | Public | Refresh access token |
| GET | `/api/v1/auth/me` | Private | Get current user profile |
| PUT | `/api/v1/auth/me` | Private | Update user profile |
| PUT | `/api/v1/auth/update-password` | Private | Update password |
| POST | `/api/v1/auth/logout` | Private | Logout (client-side token removal) |

---

## 🚀 Usage Examples

### Register a User
```javascript
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Login
```javascript
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### Access Protected Route
```javascript
GET /api/v1/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Refresh Token
```javascript
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Protect Route with Role
```javascript
// In route file
router.get(
  '/admin-dashboard',
  protect,                    // Verify token
  authorize('admin', 'org_admin'), // Check role
  controller.adminDashboard
);
```

---

## 🔄 Token Flow

### Initial Authentication:
1. User registers/logs in
2. Server generates accessToken + refreshToken
3. Client stores both tokens securely

### Accessing Protected Routes:
1. Client sends accessToken in Authorization header
2. Middleware verifies token
3. If valid, request proceeds
4. If expired, client uses refreshToken to get new accessToken

### Token Refresh Flow:
1. Access token expires
2. Client sends refreshToken to `/api/v1/auth/refresh`
3. Server verifies refreshToken
4. Server returns new accessToken
5. Client updates accessToken

---

## 🛡️ Best Practices

### Frontend Token Storage:
- **Recommended**: HttpOnly cookies for refresh tokens
- **Alternative**: Secure localStorage/sessionStorage for access tokens
- **Never**: Store tokens in regular cookies or global variables

### Token Rotation (Future Enhancement):
- Consider rotating refresh tokens on each use
- Implement token blacklist for logout (Redis recommended)

### Rate Limiting (Future):
- Add rate limiting to login/register endpoints
- Prevent brute force attacks

---

## 📝 Error Responses

All errors follow consistent format:

```json
{
  "success": false,
  "error": {
    "code": 401,
    "message": "Error message",
    "details": "Optional details" // Only in development
  }
}
```

### Common Error Codes:
- `400` - Validation error / Bad request
- `401` - Unauthorized / Invalid credentials / Token expired
- `403` - Forbidden / Account blocked / Insufficient permissions
- `409` - Conflict / User already exists
- `500` - Server error

---

## 🔧 Configuration

Environment variables required:
```env
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

---

*Authentication system is production-ready. Next: Emergency system or Socket.IO integration.*

