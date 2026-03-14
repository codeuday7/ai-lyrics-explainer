const mongoose = require('mongoose');

const explanationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    songName: {
      type: String,
      required: [true, 'Song name is required'],
      trim: true,
    },
    artist: {
      type: String,
      trim: true,
      default: 'Unknown Artist',
    },
    lyrics: {
      type: String,
      required: [true, 'Lyrics are required'],
    },
    theme: {
      type: String,
      required: true,
    },
    emotionalTone: {
      type: String,
      required: true,
    },
    verseBreakdown: {
      type: [String],
      default: [],
    },
    hiddenMeaning: {
      type: String,
      required: true,
    },
    overallMessage: {
      type: String,
      required: true,
    },
    culturalContext: {
      type: String,
      required: true,
      default: 'No cultural context provided.',
    },
    ahaInsight: {
      type: String,
      required: true,
      default: 'No insight provided.',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Text index for search
explanationSchema.index({ songName: 'text', artist: 'text' });

module.exports = mongoose.model('Explanation', explanationSchema);
