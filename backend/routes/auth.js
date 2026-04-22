const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware');
const { attachDbUser } = require('../middleware/roleCheck');

// POST /api/auth/register — Sync Firebase user to MongoDB
router.post('/register', authMiddleware, async (req, res) => {
  try {
    const { name, collegeId, department, year, role, designation } = req.body;
    const firebaseUid = req.user.uid;
    const email = req.user.email || req.body.email;

    let user = await User.findOne({ firebaseUid });
    if (user) {
      return res.status(200).json({ message: 'User already registered', user });
    }

    try {
      user = await User.create({
        firebaseUid,
        name: name || req.user.name || email.split('@')[0],
        email,
        collegeId: collegeId || '',
        department: department || '',
        year: year || '',
        designation: designation || '',
        role: role || 'student',
        provider: req.user.firebase?.sign_in_provider === 'google.com' ? 'google' : 'email',
      });
    } catch (createError) {
      if (createError.code === 11000) {
        user = await User.findOne({ firebaseUid });
      } else {
        throw createError;
      }
    }

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// GET /api/auth/me — Get current user profile
router.get('/me', authMiddleware, attachDbUser, async (req, res) => {
  try {
    const user = await User.findById(req.dbUser._id)
      .populate('followers', 'name avatar')
      .populate('following', 'name avatar');
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
