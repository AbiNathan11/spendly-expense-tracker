// const { supabase } = require('../config/supabase');

// // Register user
// const registerUser = async (req, res) => {
//     const { email, password } = req.body;
//     const { data, error } = await supabase.auth.signUp({ email, password });

//     if (error) return res.status(400).json({ error: error.message });
//     res.status(200).json({ message: 'User registered', data });
// };

// // Login user
// const loginUser = async (req, res) => {
//     const { email, password } = req.body;
//     const { data, error } = await supabase.auth.signInWithPassword({ email, password });

//     if (error) return res.status(400).json({ error: error.message });
//     res.status(200).json({ message: 'Login successful', data });
// };

// module.exports = {
//     registerUser,
//     loginUser
// };

const { supabase, supabaseAdmin } = require('../config/supabase');

// Register user (server-side)
const registerUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email & password required' });

  try {
    // Check if supabaseAdmin is properly initialized
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY.' });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ message: 'User registered successfully', user: data });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email & password required' });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({
      message: 'Login successful',
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { registerUser, loginUser };
