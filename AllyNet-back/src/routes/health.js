const express = require('express');
const mongoose = require('mongoose');
const { User } = require('../models');
const router = express.Router();

/**
 * Health Check Route
 * Used for monitoring and load balancer health checks
 */
router.get('/', async (req, res) => {
  try {
    const dbName = mongoose.connection.name;
    const userCount = await User.countDocuments();
    
    // Get all user emails for debugging
    const users = await User.find({}).select('email _id').limit(10);
    
    res.status(200).json({
      success: true,
      message: 'AllyNet Backend is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        name: dbName,
        host: mongoose.connection.host,
        collection: 'users',
        userCount: userCount,
        sampleUsers: users.map(u => ({ _id: u._id, email: u.email }))
      }
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      message: 'AllyNet Backend is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        error: 'Unable to query database',
        errorMessage: error.message
      }
    });
  }
});

module.exports = router;

