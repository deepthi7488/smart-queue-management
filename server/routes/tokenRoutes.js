const express = require('express');
const router = express.Router();
const {
  bookOnlineToken,
  bookOfflineToken,
  getMyTokens,
  getTokenStatus,
  cancelToken,
} = require('../controllers/tokenController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Patient online booking
router.post('/book-online', protect, authorize('patient'), bookOnlineToken);

// Admin offline booking
router.post('/book-offline', protect, authorize('admin'), bookOfflineToken);

// Patient's own tokens
router.get('/my-tokens', protect, authorize('patient'), getMyTokens);

// Public / Patient status check for a specific token
router.get('/:id/status', getTokenStatus);

// Cancel token (Patient or Admin)
router.put('/:id/cancel', protect, cancelToken);

module.exports = router;
