const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db/database');
const seed = require('./db/seed');

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize Database & Seed
seed();

// Routes
const authRoutes = require('./routes/auth');
const teacherRoutes = require('./routes/teachers');
const attendanceRoutes = require('./routes/attendance');
const resultsRoutes = require('./routes/results');
const feeRoutes = require('./routes/fees');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
