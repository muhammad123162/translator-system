const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Every route below requires a logged-in admin.
router.use(requireAuth, requireRole('admin'));

router.get('/dashboard', adminController.getDashboardStats);

router.get('/users', adminController.listUsers);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/active', adminController.setUserActive);

router.get('/translation-logs', adminController.getTranslationLogs);

router.get('/languages', adminController.listLanguages);
router.patch('/languages/:id/active', adminController.setLanguageActive);

module.exports = router;
