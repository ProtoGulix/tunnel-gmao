/**
 * Tunnel GMAO - Main Server File
 * Copyright (C) 2024 ProtoGulix
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Rate limiting for static files (more permissive)
const staticLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(staticLimiter);
app.use(express.static(path.join(__dirname, '../public')));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Routes
const machinesRouter = require('./routes/machines');
const interventionsRouter = require('./routes/interventions');
const requestsRouter = require('./routes/requests');
const purchasesRouter = require('./routes/purchases');

app.use('/api/machines', machinesRouter);
app.use('/api/interventions', interventionsRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/purchases', purchasesRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    name: process.env.APP_NAME || 'Tunnel GMAO',
    version: require('../package.json').version,
    timestamp: new Date().toISOString()
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Tunnel GMAO server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Access at: ${process.env.APP_URL || `http://localhost:${PORT}`}`);
});

module.exports = app;
