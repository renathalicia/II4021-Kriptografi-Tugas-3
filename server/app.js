require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// CORS Configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const corsOptions = {
  origin: corsOrigin, // Configurable via CORS_ORIGIN env var
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie Parser
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes (register, login, logout)
// Routes: POST /auth/register, POST /auth/login, POST /auth/logout
app.use('/auth', require('./routes/auth'));

// Users routes
// Routes: GET /users/contacts, GET /users/:email/pubkey
app.use('/users', require('./routes/users'));

// Messages routes
// Routes: POST /messages, GET /messages?with=:email
app.use('/messages', require('./routes/messages'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} tidak ditemukan`,
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: err.name || 'Error',
    message: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;