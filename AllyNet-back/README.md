# AllyNet Backend

Production-grade backend for AllyNet - a safety-first, real-time community platform.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB (local or cloud instance)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start MongoDB (if running locally):
```bash
# Make sure MongoDB is running on localhost:27017
# Or update MONGODB_URI in .env
```

4. Run the server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

5. Test the server:
```bash
curl http://localhost:5000/api/health
```

## 📁 Project Structure

```
src/
├── config/          # Configuration files (DB, etc.)
├── controllers/     # Request handlers
├── models/          # Mongoose schemas
├── routes/          # Express routes
├── middleware/      # Custom middleware (auth, errors, etc.)
├── services/        # Business logic layer
├── sockets/         # Socket.IO event handlers
├── utils/           # Utility functions
├── app.js           # Express app setup
└── server.js        # Server bootstrap
```

## 🔐 Environment Variables

See `.env.example` for required environment variables.

**Important**: Never commit `.env` to version control.

## 📚 Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## 🛠️ Development

- **Hot reload**: Use `npm run dev` (nodemon)
- **Health check**: `GET /api/health`
- **Error handling**: Global error handler in `src/middleware/errorHandler.js`

## 🔒 Security Notes

- All passwords are hashed using bcrypt
- JWT tokens for authentication
- Input validation required on all routes
- CORS configured for frontend origin
- Environment variables for secrets

## 📝 Next Steps

This is the initial setup. Next implementation phases:
1. Database models (User, Emergency)
2. Authentication system (JWT, routes, middleware)
3. Emergency (SOS) system
4. Socket.IO real-time events
5. Additional features (Help Requests, Skills, etc.)

---

**Status**: 🟢 Initial Setup Complete

