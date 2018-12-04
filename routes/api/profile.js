const express = require('express');
const router = express.Router();

// @route   GET api/profile/test
// @desc    Tests profile route
// @access  Public
router.get('/test', (req, res) => res.json({
    msg: 'Profile Works'
}));

// Have to export router in order for server.js to pick it up
module.exports = router;