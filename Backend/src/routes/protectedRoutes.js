const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const router = express.Router();

// Example protected route
router.get('/protected', authenticateUser, (req, res) => {
  res.json({
    success: true,
    message: 'You have accessed a protected route!',
    user: req.user
  });
});

module.exports = router;