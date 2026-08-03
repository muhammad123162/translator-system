const express = require('express');
const router = express.Router();

/**
 * These are plain page routes serving server-rendered HTML (EJS).
 * They deliberately do NOT check authentication server-side for pages
 * like dashboard/translator — the actual protected data is fetched
 * client-side from /api/... (which IS protected by requireAuth), and
 * translator.js redirects to /login if that call returns 401. This
 * keeps the page layer simple while the API layer remains the real
 * security boundary.
 */

router.get('/', (req, res) => {
  res.render('landing', { title: 'Home', activePage: 'landing' });
});

router.get('/login', (req, res) => {
  res.render('login', { title: 'Login', activePage: 'login', bodyClass: 'auth-page' });
});

router.get('/register', (req, res) => {
  res.render('register', { title: 'Create Account', activePage: 'register', bodyClass: 'auth-page' });
});

router.get('/dashboard', (req, res) => {
  res.render('dashboard', { title: 'Dashboard', activePage: 'dashboard', bodyClass: 'app-page' });
});

router.get('/translator', (req, res) => {
  res.render('translator', { title: 'Translator', activePage: 'translator', bodyClass: 'app-page' });
});

router.get('/history', (req, res) => {
  res.render('history', { title: 'Translation History', activePage: 'history', bodyClass: 'app-page' });
});

router.get('/profile', (req, res) => {
  res.render('profile', { title: 'My Profile', activePage: 'profile', bodyClass: 'app-page' });
});

router.get('/settings', (req, res) => {
  res.render('settings', { title: 'Settings', activePage: 'settings', bodyClass: 'app-page' });
});

router.get('/admin', (req, res) => {
  res.render('admin', { title: 'Admin Dashboard', activePage: 'admin', bodyClass: 'app-page admin-page' });
});

module.exports = router;
