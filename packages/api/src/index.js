require('dotenv').config();
const express = require('express');
const cors = require('cors');
const assessmentRoutes = require('./routes/assessments');
const respondentRoutes = require('./routes/respondent');
const authRoutes = require('./routes/auth');
const consultantRoutes = require('./routes/consultant');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/respondent', respondentRoutes);
app.use('/api/consultant', consultantRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
  });
});

app.listen(PORT, () => {
  console.log(`GreenOps Assessment API running on port ${PORT}`);
});

module.exports = app;
