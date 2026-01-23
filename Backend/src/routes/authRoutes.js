const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { supabase, supabaseAdmin } = require('../config/supabase');
const { sendOTPEmail } = require('../services/emailService');

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map(); // { email: { otp, expiresAt, verified } }


// Signup
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  console.log('Signup request received:', { email, name, passwordProvided: !!password });

  try {
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into our users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert([{
        name: name || email,
        email: email,
        password_hash: passwordHash
      }])
      .select()
      .single();

    if (userError) {
      console.log('Failed to create user in users table:', userError);
      return res.status(400).json({ success: false, error: userError.message });
    }

    // Use admin client to create user with auto-confirmation
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name || email,
        user_id: userData.id
      }
    });

    console.log('Supabase signup response:', { data: data?.user ? 'User created' : 'No user', error: error?.message });

    if (error) {
      console.log('Supabase signup error:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    // Insert into user_settings after successful signup
    const userId = data.user?.id;
    if (userId) {
      console.log('Creating user_settings for user:', userId);
      try {
        const { error: settingsError } = await supabaseAdmin
          .from('user_settings')
          .insert([{
            user_id: userId,
            full_name: name || email
          }]);

        if (settingsError) {
          console.log('Failed to create user_settings:', settingsError.message);
          // Don't block signup - user can be created without settings initially
        } else {
          console.log('user_settings created successfully');
        }
      } catch (settingsErr) {
        console.log('user_settings insertion error:', settingsErr.message);
        // Don't block signup
      }
    }

    console.log('Signup completed successfully');
    res.status(201).json({ success: true, message: 'User registered', user: data.user });
  } catch (err) {
    console.log('Signup server error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login request received for email:', email);

  try {
    // First authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ success: false, error: error.message });

    console.log('Supabase auth successful for:', email);

    // Fetch user data from our users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, created_at')
      .eq('email', email)
      .single();

    console.log('Users table query result:', { userData, userError });

    if (userError) {
      console.log('Failed to fetch user data:', userError);
      // Still return login success even if user data fetch fails
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        session: data.session
      });
    }

    console.log('User data found:', userData);

    // Fetch user settings
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('currency, daily_budget, limit_updated_at, avatar_url')
      .eq('user_id', data.user.id)
      .single();

    console.log('User settings fetch result:', { settingsData, settingsError });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      session: data.session,
      user: userData,
      settings: settingsData || { currency: 'LKR', daily_budget: 200, limit_updated_at: null, avatar_url: null }
    });
  } catch (err) {
    console.log('Login server error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ OTP-BASED PASSWORD RESET ============

// Generate and send OTP
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  console.log('OTP request received for email:', email);

  try {
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      console.log('User not found:', email);
      return res.status(404).json({ success: false, error: 'User not found with this email' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(email, {
      otp,
      expiresAt,
      verified: false
    });

    console.log('Generated OTP for', email, ':', otp); // For development - remove in production

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      console.log('Failed to send OTP email');
      // Still return success for development, but log the OTP
      return res.status(200).json({
        success: true,
        message: 'OTP generated (email service unavailable)',
        devOtp: otp // Only for development - remove in production
      });
    }

    console.log('OTP sent successfully to:', email);
    res.status(200).json({
      success: true,
      message: 'OTP sent to your email address'
    });

  } catch (err) {
    console.log('Send OTP error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  console.log('OTP verification request for email:', email);

  try {
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' });
    }

    const storedData = otpStore.get(email);

    if (!storedData) {
      console.log('No OTP found for email:', email);
      return res.status(400).json({ success: false, error: 'No OTP found. Please request a new one.' });
    }

    // Check if OTP expired
    if (Date.now() > storedData.expiresAt) {
      console.log('OTP expired for:', email);
      otpStore.delete(email);
      return res.status(400).json({ success: false, error: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      console.log('Invalid OTP for:', email);
      return res.status(400).json({ success: false, error: 'Invalid OTP. Please try again.' });
    }

    // Mark as verified
    storedData.verified = true;
    otpStore.set(email, storedData);

    console.log('OTP verified successfully for:', email);
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (err) {
    console.log('Verify OTP error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset password with verified OTP
router.post('/reset-password-with-otp', async (req, res) => {
  const { email, newPassword } = req.body;
  console.log('Password reset request for email:', email);

  try {
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email and new password are required' });
    }

    const storedData = otpStore.get(email);

    if (!storedData) {
      console.log('No OTP session found for:', email);
      return res.status(400).json({ success: false, error: 'No OTP session found. Please start over.' });
    }

    if (!storedData.verified) {
      console.log('OTP not verified for:', email);
      return res.status(400).json({ success: false, error: 'OTP not verified. Please verify OTP first.' });
    }

    // Check if OTP session expired
    if (Date.now() > storedData.expiresAt) {
      console.log('OTP session expired for:', email);
      otpStore.delete(email);
      return res.status(400).json({ success: false, error: 'OTP session expired. Please start over.' });
    }

    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in users table
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('email', email);

    if (updateError) {
      console.log('Failed to update password in users table:', updateError);
      return res.status(400).json({ success: false, error: updateError.message });
    }

    // Update password in Supabase Auth
    const { data: authUserData, error: authUserError } = await supabaseAdmin.auth.admin.listUsers();
    let supabaseUserId = null;

    if (!authUserError && authUserData.users) {
      const authUser = authUserData.users.find(user => user.email === email);
      supabaseUserId = authUser?.id;
    }

    if (supabaseUserId) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        supabaseUserId,
        { password: newPassword }
      );

      if (authUpdateError) {
        console.log('Failed to update Supabase auth password:', authUpdateError);
        // Continue anyway as we updated the users table
      }
    }

    // Clear OTP session
    otpStore.delete(email);

    console.log('Password reset successfully for:', email);
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (err) {
    console.log('Reset password error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ END OTP-BASED PASSWORD RESET ============

// Test password reset (shows link in browser instead of sending email)
router.post('/reset-password-test', async (req, res) => {
  const { email } = req.body;
  try {
    // Generate a test reset link
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://192.168.1.5:3000/reset-password'
    });

    if (error) return res.status(400).json({ success: false, error: error.message });

    // For testing: return a simulated magic link
    const testLink = `http://192.168.1.5:3000/reset-password#access_token=test_token&refresh_token=test_refresh_token&type=recovery`;

    res.status(200).json({
      success: true,
      message: 'Password reset link generated (for testing)',
      testLink: testLink,
      note: 'In production, this would be sent via email'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Password reset
router.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  console.log('Password reset request received for email:', email);

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://192.168.1.5:3000/reset-password'
    });

    console.log('Supabase response:', { data, error });

    if (error) {
      console.log('Supabase error:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    console.log('Password reset email sent successfully');
    res.status(200).json({ success: true, message: 'Password reset email sent', data });
  } catch (err) {
    console.log('Server error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  const { email, name, currency, dailyBudget, avatar } = req.body;
  console.log('Profile update request:', { email, name, currency, dailyBudget, avatar });

  try {
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Update users table (name)
    if (name) {
      console.log('Updating users table with name:', name);
      const { error: userError } = await supabaseAdmin
        .from('users')
        .update({ name })
        .eq('email', email);

      if (userError) {
        console.log('Failed to update users table:', userError);
        return res.status(400).json({ success: false, error: userError.message });
      }
      console.log('Users table updated successfully');
    }

    // Get Supabase auth user_id from auth.users table using email
    const { data: authUserData, error: authUserError } = await supabaseAdmin.auth.admin.listUsers();
    let supabaseUserId = null;

    if (!authUserError && authUserData.users) {
      const authUser = authUserData.users.find(user => user.email === email);
      supabaseUserId = authUser?.id;
    }

    if (!supabaseUserId) {
      console.log('Failed to find Supabase auth user for email:', email);
      return res.status(404).json({ success: false, error: 'Supabase auth user not found' });
    }

    console.log('Found Supabase auth user_id:', supabaseUserId);

    // Update Supabase auth user metadata (name and email)
    const authUpdates = {};
    if (name) authUpdates.user_metadata = { full_name: name };

    if (Object.keys(authUpdates).length > 0) {
      console.log('Updating Supabase auth user metadata:', authUpdates);
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        supabaseUserId,
        authUpdates
      );

      if (authUpdateError) {
        console.log('Failed to update Supabase auth user:', authUpdateError);
        return res.status(400).json({ success: false, error: authUpdateError.message });
      }
      console.log('Supabase auth user updated successfully');
    }

    // Update user_settings table (currency, daily_budget, full_name)
    const settingsUpdates = {};
    if (currency) settingsUpdates.currency = currency;
    if (dailyBudget) {
      settingsUpdates.daily_budget = dailyBudget;
      settingsUpdates.limit_updated_at = new Date().toISOString().split('T')[0];
    }
    if (name) settingsUpdates.full_name = name;
    if (avatar) settingsUpdates.avatar_url = avatar;

    console.log('Settings updates to apply:', settingsUpdates);

    if (Object.keys(settingsUpdates).length > 0) {
      // First check if user_settings record exists
      const { data: existingSettings, error: checkError } = await supabaseAdmin
        .from('user_settings')
        .select('id')
        .eq('user_id', supabaseUserId)
        .single();

      console.log('Checking existing user_settings:', { existingSettings, checkError });

      if (checkError && checkError.code === 'PGRST116') {
        // No record exists, create one
        console.log('No existing user_settings record, creating new one');
        const { error: insertError } = await supabaseAdmin
          .from('user_settings')
          .insert({
            user_id: supabaseUserId,
            ...settingsUpdates
          });

        if (insertError) {
          console.log('Failed to insert user_settings:', insertError);
          return res.status(400).json({ success: false, error: insertError.message });
        }
        console.log('User settings created successfully');
      } else if (checkError) {
        console.log('Failed to check user_settings:', checkError);
        return res.status(400).json({ success: false, error: checkError.message });
      } else {
        // Record exists, update it
        console.log('Updating existing user_settings record');
        const { error: settingsError } = await supabaseAdmin
          .from('user_settings')
          .update(settingsUpdates)
          .eq('user_id', supabaseUserId);

        console.log('User settings update result:', { settingsError });

        if (settingsError) {
          console.log('Failed to update user_settings:', settingsError);
          return res.status(400).json({ success: false, error: settingsError.message });
        } else {
          console.log('User settings updated successfully');
        }
      }
    }

    console.log('Profile updated successfully');
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (err) {
    console.log('Profile update error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user settings (for debugging)
router.get('/user-settings/:email', async (req, res) => {
  const { email } = req.params;
  console.log('Getting user settings for email:', email);

  try {
    // Get Supabase auth user_id from auth.users table using email
    const { data: authUserData, error: authUserError } = await supabaseAdmin.auth.admin.listUsers();
    let supabaseUserId = null;

    if (!authUserError && authUserData.users) {
      const authUser = authUserData.users.find(user => user.email === email);
      supabaseUserId = authUser?.id;
    }

    if (!supabaseUserId) {
      console.log('Failed to find Supabase auth user for email:', email);
      return res.status(404).json({ success: false, error: 'Supabase auth user not found' });
    }

    console.log('Found Supabase auth user_id:', supabaseUserId);

    // Get user_settings
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', supabaseUserId)
      .single();

    console.log('User settings query result:', { settingsData, settingsError });

    if (settingsError && settingsError.code === 'PGRST116') {
      console.log('No user_settings record found');
      return res.status(404).json({ success: false, error: 'No user settings found' });
    } else if (settingsError) {
      console.log('Failed to fetch user settings:', settingsError);
      return res.status(400).json({ success: false, error: settingsError.message });
    }

    console.log('User settings found:', settingsData);
    res.status(200).json({
      success: true,
      settings: settingsData
    });

  } catch (err) {
    console.log('Get user settings error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Handle password reset page
router.get('/reset-password', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reset Password - Spendly</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          max-width: 400px;
          width: 100%;
        }
        .logo {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo h1 {
          color: #F59E0B;
          font-size: 32px;
          margin: 0;
        }
        .logo p {
          color: #6B7280;
          margin: 5px 0 0 0;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 8px;
          color: #374151;
          font-weight: 600;
        }
        input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #E5E7EB;
          border-radius: 10px;
          font-size: 16px;
          box-sizing: border-box;
        }
        input:focus {
          outline: none;
          border-color: #F59E0B;
        }
        .btn {
          width: 100%;
          padding: 14px;
          background: #223447;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn:hover {
          background: #1a2938;
        }
        .btn:disabled {
          background: #9CA3AF;
          cursor: not-allowed;
        }
        .message {
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: none;
        }
        .success {
          background: #D1FAE5;
          color: #065F46;
          border: 1px solid #6EE7B7;
        }
        .error {
          background: #FEE2E2;
          color: #991B1B;
          border: 1px solid #FCA5A5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>Spendly</h1>
          <p>Reset Your Password</p>
        </div>
        
        <div id="message" class="message"></div>
        
        <form id="resetForm">
          <div class="form-group">
            <label for="password">New Password</label>
            <input type="password" id="password" name="password" required minlength="6">
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirm New Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" required>
          </div>
          <button type="submit" class="btn">Reset Password</button>
        </form>
        
        <p style="text-align: center; margin-top: 20px; color: #6B7280;">
          <a href="spendly://auth" style="color: #F59E0B; text-decoration: none;">Return to App</a>
        </p>
      </div>

      <script>
        const form = document.getElementById('resetForm');
        const messageDiv = document.getElementById('message');
        
        // Get tokens from URL hash
        function getTokensFromHash() {
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          return {
            accessToken: params.get('access_token'),
            refreshToken: params.get('refresh_token')
          };
        }
        
        function showMessage(message, type) {
          messageDiv.textContent = message;
          messageDiv.className = \`message \${type}\`;
          messageDiv.style.display = 'block';
        }
        
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const password = document.getElementById('password').value;
          const confirmPassword = document.getElementById('confirmPassword').value;
          const tokens = getTokensFromHash();
          
          if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
          }
          
          if (password.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
          }
          
          if (!tokens.accessToken) {
            showMessage('Invalid or expired reset link', 'error');
            return;
          }
          
          const button = form.querySelector('button');
          button.disabled = true;
          button.textContent = 'Resetting...';
          
          try {
            const response = await fetch('/api/auth/update-password', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token: tokens.accessToken,
                password: password
              })
            });
            
            const result = await response.json();
            
            if (result.success) {
              showMessage('Password reset successfully! You can now return to the app and login.', 'success');
              form.reset();
            } else {
              showMessage(result.error || 'Failed to reset password', 'error');
            }
          } catch (error) {
            showMessage('Network error. Please try again.', 'error');
          } finally {
            button.disabled = false;
            button.textContent = 'Reset Password';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Update password endpoint
router.post('/update-password', async (req, res) => {
  const { token, password } = req.body;
  try {
    const { data, error } = await supabase.auth.updateUser({
      access_token: token,
      password: password
    });

    if (error) return res.status(400).json({ success: false, error: error.message });
    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;