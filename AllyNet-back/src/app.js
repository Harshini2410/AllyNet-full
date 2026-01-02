const express = require('express');
const cors = require('cors');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const emergencyRoutes = require('./routes/emergency');
const helpRequestRoutes = require('./routes/helpRequest');
const adRoutes = require('./routes/ad');
const contactRoutes = require('./routes/contact');

/**
 * Express Application Setup
 * Core middleware and route configuration
 */
const app = express();

// CORS Configuration
// Allow all Vite dev ports (5173, 5174, 5175) and production frontend URL
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, allow all localhost origins for flexibility
      if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging (simple version - can be enhanced with morgan)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/emergencies', emergencyRoutes);
app.use('/api/v1/help-requests', helpRequestRoutes);
app.use('/api/v1/ads', adRoutes);
app.use('/api/v1/contact', contactRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to AllyNet Backend API',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 404,
      message: `Route ${req.originalUrl} not found`
    }
  });
});

// Global Error Handler (must be last)
app.use(errorHandler);

module.exports = app;

