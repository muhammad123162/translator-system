const express = require('express');
const translationController = require('../controllers/translationController');
const { requireAuth } = require('../middleware/authMiddleware');
const { translateLimiter } = require('../middleware/rateLimiter');
const { translateValidation, historySearchValidation } = require('../middleware/validators');

const router = express.Router();

// All translation routes require a logged-in user.
router.use(requireAuth);

router.get('/languages', translationController.listLanguages);
router.post('/detect', translateLimiter, translationController.detect);
router.post('/', translateLimiter, translateValidation, translationController.translate);

router.get('/history', historySearchValidation, translationController.getHistory);
router.delete('/history', translationController.clearHistory);
router.delete('/history/:id', translationController.deleteHistoryItem);
router.patch('/history/:id/favorite', translationController.toggleFavorite);

router.get('/stats', translationController.getStats);

module.exports = router;
