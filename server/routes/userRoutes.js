const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/authMiddleware');
const { handleValidation } = require('../middleware/validators');

const router = express.Router();
router.use(requireAuth);

router.get('/profile', userController.getProfile);

router.put(
  '/profile',
  [
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('email').trim().isEmail().normalizeEmail(),
    handleValidation,
  ],
  userController.updateProfile
);

router.put(
  '/profile/password',
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).matches(/\d/),
    handleValidation,
  ],
  userController.changePassword
);

module.exports = router;
