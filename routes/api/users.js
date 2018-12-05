const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs'); // Encrypt password
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport') // Protected route

// Load Input Validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

// Load User model
const User = require('../../models/User');

// @route   GET api/users/test
// @desc    Tests users route
// @access  Public
router.get('/test', (req, res) => res.json({
    msg: 'Users Works'
}));

// @route   GET api/users/register
// @desc    Register user
// @access  Public
router.post('/register', (req, res) => {
    const {
        errors,
        isValid
    } = validateRegisterInput(req.body);

    if (!isValid) {
        return res.status(400).json(errors);
    }

    // Looking for duplicates
    User.findOne({
            email: req.body.email
        })
        .then(user => {
            if (user) {
                errors.email = 'Email already exists';
                // If user already exists
                return res.status(400).json(errors);
            } else {
                const avatar = gravatar.url(req.body.email, {
                    s: '200', // Size
                    r: 'pg', // Rating
                    d: 'mm' // Default
                });
                // Creates new user
                const newUser = new User({
                    name: req.body.name,
                    email: req.body.email,
                    avatar: avatar,
                    password: req.body.password
                });

                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err;
                        newUser.password = hash;
                        newUser.save()
                            .then(user => res.json(user)) // Respond with user
                            .catch(err => console.log(err));
                    })
                })
            }
        })
});

// @route   GET api/users/login
// @desc    Login User / Returning JSON Web Token (JWT)
// @access  Public
router.post('/login', (req, res) => {
    const {
        errors,
        isValid
    } = validateLoginInput(req.body);

    if (!isValid) {
        return res.status(400).json(errors);
    }

    const email = req.body.email;
    const password = req.body.password;

    // Find the user by email
    User.findOne({
            email: email
        })
        .then(user => {
            // Check for user
            if (!user) {
                errors.email = 'User not found'
                return res.status(404).json(errors);
            }

            // Check password
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if (isMatch) {
                        // User matched
                        const payload = {
                            id: user.id,
                            name: user.name,
                            avatar: user.avatar
                        } // Create JWT payload
                        // Sign token
                        jwt.sign(payload,
                            keys.secretOrKey, {
                                expiresIn: 3600 // 1 hour
                            }, (err, token) => {
                                res.json({
                                    success: true,
                                    token: 'Bearer ' + token // Sent to header
                                });
                            });
                    } else {
                        errors.password = 'Password incorrect'
                        return res.status(400).json(errors);
                    }
                })
        });
})

// @route   GET api/users/current
// @desc    Return current user (whoever the current user is)
// @access  Private
router.get('/current', passport.authenticate('jwt', {
    session: false
}), (req, res) => {
    // Now it's protected
    //res.json(req.user); // This shows password so don't use
    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
    });
});

// Have to export router in order for server.js to pick it up
module.exports = router;