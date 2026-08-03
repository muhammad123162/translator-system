const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const xss = require('xss-clean');

const config = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const translationRoutes = require('./routes/translationRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pageRoutes = require('./routes/pageRoutes');

const app = express();

// Server-rendered views (EJS). Partials in views/partials/ (head, navbar,
// footer, sidebar) are shared across pages instead of copy-pasted markup.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// --- Security middleware ---
// helmet sets a battery of protective HTTP headers (CSP, X-Frame-Options,
// X-Content-Type-Options, etc.) — the baseline defence against several
// classes of client-side attacks including clickjacking and MIME-sniffing.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://fonts.googleapis.com',
          'https://cdnjs.cloudflare.com',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://kit.fontawesome.com'],
        imgSrc: ["'self'", 'data:'],
      },
    },
  })
);

// CORS is locked to the configured client origin (not "*"), and
// credentials are allowed so the httpOnly auth cookies are sent.
app.use(cors({ origin: config.clientUrl, credentials: true }));

// xss-clean sanitizes req.body/query/params, stripping HTML/script
// content — a second layer of XSS defence beyond output-encoding.
app.use(xss());

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// General rate limiting on all API routes (translation endpoint has
// its own stricter limiter layered on top — see rateLimiter.js).
app.use('/api', apiLimiter);

// --- Static assets + server-rendered views ---
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/translations', translationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ success: true, message: 'API is healthy.' }));

// --- Page routes (server-rendered EJS views) ---
app.use('/', pageRoutes);

// --- 404 + centralized error handling (must be registered last) ---
app.use('/api', notFoundHandler);
app.use((req, res) => res.status(404).render('errors/404', { title: 'Page Not Found', activePage: null }));
app.use(errorHandler);

module.exports = app;
