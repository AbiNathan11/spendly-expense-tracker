const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ success: false, error: error.message });
    res.status(201).json({ success: true, message: 'User registered', user: data.user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ success: false, error: error.message });
    res.status(200).json({ success: true, message: 'Login successful', session: data.session });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Password reset
router.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/reset-password'
    });
    if (error) return res.status(400).json({ success: false, error: error.message });
    res.status(200).json({ success: true, message: 'Password reset email sent', data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
