const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Register GET route
router.get('/register', (req, res) => {
    res.render('auth/register', { title: 'Register' });
});

// Register POST route
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = new User({ username, email, password });
        await user.save();
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.render('auth/register', { error: 'Registration failed. Try again.', title: 'Register' });
    }
});

// Login GET route
router.get('/login', (req, res) => {
    res.render('auth/login', { title: 'Login' });
});

// Login POST route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && await user.matchPassword(password)) {
            req.session.userId = user._id;
            res.redirect('/');
        } else {
            res.render('auth/login', { error: 'Invalid credentials', title: 'Login' });
        }
    } catch (err) {
        console.error(err);
        res.render('auth/login', { error: 'Login failed', title: 'Login' });
    }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

module.exports = router;