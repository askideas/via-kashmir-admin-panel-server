const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initializeFirebase } = require('./config/firebase');
const { initializeImageKit } = require('./config/imagekit');

// Import routes
const categoryRoutes = require('./routes/categories');
const employeeRoutes = require('./routes/employees');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase and ImageKit
initializeFirebase();
initializeImageKit();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Via Kashmir Admin Server is running!',
        status: 'success',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/categories', categoryRoutes);
app.use('/employees', employeeRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        message: 'Route not found',
        status: 'error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Via Kashmir Admin Server is running on port ${PORT}`);
    console.log(`📱 Server URL: http://localhost:${PORT}`);
});

module.exports = app;