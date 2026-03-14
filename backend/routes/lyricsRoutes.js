const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  analyze,
  saveExplanation,
  getFeed,
  searchExplanations,
  getMyExplanations,
} = require('../controllers/lyricsController');

// Public routes
router.get('/feed', getFeed);
router.get('/search', searchExplanations);

// Protected routes
router.post('/analyze', protect, analyze);
router.post('/save', protect, saveExplanation);
router.get('/my-explanations', protect, getMyExplanations);

module.exports = router;
