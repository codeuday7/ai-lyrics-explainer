const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  analyze,
  saveExplanation,
  getFeed,
  searchExplanations,
  getMyExplanations,
  getLanguages,
} = require('../controllers/lyricsController');

// Public routes
router.get('/feed', getFeed);
router.get('/search', searchExplanations);
router.get('/languages', getLanguages);

// Protected routes
router.post('/analyze', protect, analyze);
router.post('/save', protect, saveExplanation);
router.get('/my-explanations', protect, getMyExplanations);

module.exports = router;
