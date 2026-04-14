/**
 * DEPRECATED: This Node.js/Express server is no longer used.
 * The project now uses Spring Boot backend (see backend/ directory).
 * 
 * This file is kept for reference only and can be safely deleted.
 * All backend functionality has been migrated to Spring Boot.
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/badya-uni-events', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Import routes
const eventRoutes = require('./models');

// Routes
app.use('/api/events', eventRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Badya University Event Booking API' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 