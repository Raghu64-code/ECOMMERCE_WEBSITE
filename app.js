require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const methodOverride = require('method-override');
const imagekit = require('./utils/imagekit'); // Utility to handle ImageKit

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));

// Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 } // 1 hour
}));

// Global variable for current user
app.use((req, res, next) => {
    res.locals.user = req.session.userId ? { _id: req.session.userId } : null;
    res.locals.isLoggedIn = !!req.session.userId;
    next();
});

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const indexRoutes = require('./routes/index');

app.use(authRoutes);
app.use(productRoutes);
app.use(indexRoutes);

app.listen(PORT, () => {
    console.log( "Server is running");
});