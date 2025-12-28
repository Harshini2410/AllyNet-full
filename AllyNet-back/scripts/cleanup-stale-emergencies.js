/**
 * Cleanup Script: Mark Stale Emergencies as Resolved
 * 
 * This script identifies and resolves emergencies that:
 * 1. Reference deleted/missing user documents
 * 2. Have invalid status values
 * 3. Are older than 24 hours and still marked as active
 * 
 * Usage: node scripts/cleanup-stale-emergencies.js
 * 
 * SAFETY: This script only marks emergencies as resolved, it does NOT delete them.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Emergency, User } = require('../src/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/allynet';

async function cleanupStaleEmergencies() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let cleanedCount = 0;

    // Find all emergencies with status 'active' or 'responding'
    const activeEmergencies = await Emergency.find({
      status: { $in: ['active', 'responding'] }
    });

    console.log(`Found ${activeEmergencies.length} active/responding emergencies to check...`);

    for (const emergency of activeEmergencies) {
      let shouldResolve = false;
      const reasons = [];

      // Check 1: Verify user document exists
      try {
        const user = await User.findById(emergency.user);
        if (!user) {
          shouldResolve = true;
          reasons.push('User document missing/deleted');
        }
      } catch (error) {
        shouldResolve = true;
        reasons.push(`Error checking user: ${error.message}`);
      }

      // Check 2: Verify status is valid
      if (!['active', 'responding', 'resolved', 'cancelled'].includes(emergency.status)) {
        shouldResolve = true;
        reasons.push(`Invalid status: ${emergency.status}`);
      }

      // Check 3: Check if emergency is older than 24 hours (stale)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const emergencyDate = emergency.activatedAt || emergency.createdAt;
      if (emergencyDate && emergencyDate < oneDayAgo) {
        shouldResolve = true;
        reasons.push('Emergency older than 24 hours');
      }

      // Check 4: Verify required fields exist
      if (!emergency.location || !emergency.location.latitude || !emergency.location.longitude) {
        shouldResolve = true;
        reasons.push('Missing location data');
      }

      if (shouldResolve) {
        try {
          await emergency.resolve(
            emergency.user, // Use emergency creator as resolver
            'auto_expired',
            `Auto-resolved by cleanup script: ${reasons.join('; ')}`
          );
          cleanedCount++;
          console.log(`✅ Resolved emergency ${emergency._id}: ${reasons.join('; ')}`);
        } catch (resolveError) {
          console.error(`❌ Failed to resolve emergency ${emergency._id}:`, resolveError.message);
        }
      }
    }

    console.log(`\n✅ Cleanup complete: ${cleanedCount} stale emergencies resolved`);
    
    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup script error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run cleanup
cleanupStaleEmergencies();

