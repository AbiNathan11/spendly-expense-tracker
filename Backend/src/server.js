const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const envelopeRoutes = require('./routes/envelopeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const billRoutes = require('./routes/billRoutes');
const reportRoutes = require('./routes/reportRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const { authenticateUser } = require('./middleware/auth'); // For Supabase
const { supabase } = require('./config/supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Spendly API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/envelopes', envelopeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/protected', authenticateUser, protectedRoutes);

app.get('/api/profile', authenticateUser, (req, res) => {
  res.json({ message: 'Protected route accessed', user: req.user });
});
// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Test database connection
async function testDbConnection() {
  const { data, error } = await supabase.from('users').select().limit(1);
  if (error) {
    console.error('Database connection failed:', error.message);
  } else {
    console.log('Database connected successfully!');
  }
}

testDbConnection();

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Spendly API server running on port ${PORT}`);
  console.log(`Listen on 0.0.0.0`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

console.log("Supabase URL:", process.env.SUPABASE_URL);

module.exports = app;
