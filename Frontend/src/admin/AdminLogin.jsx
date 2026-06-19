import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import authService from '../services/authService';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [challengeData, setChallengeData] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // Handle input changes
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await authService.signIn(formData.username, formData.password);

    if (result.success) {
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => navigate('/admin/dashboard'), 1000);
    } else if (result.challengeName === 'NEW_PASSWORD_REQUIRED') {
      // User needs to set a new password
      setChallengeData({
        username: result.username,
        session: result.session
      });
      setShowPasswordReset(true);
      setError('');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  // Handle new password setup
  const handleNewPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.newPassword !== formData.confirmNewPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password requirements
    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    const result = await authService.setNewPassword(
      challengeData.username,
      formData.newPassword,
      challengeData.session
    );

    if (result.success) {
      setSuccess('Password updated successfully! Redirecting...');
      setTimeout(() => navigate('/admin/dashboard'), 1000);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ padding: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LockIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Admin Access
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Blood Bank Project Admin Dashboard
            </Typography>
          </Box>

          {/* Error/Success Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Password Reset Form */}
          {showPasswordReset ? (
            <Box component="form" onSubmit={handleNewPassword}>
              <Typography variant="h6" gutterBottom>
                Set New Password
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                You must set a new password before accessing the dashboard.
              </Typography>

              {/* New Password Field */}
              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleInputChange}
                margin="normal"
                required
                helperText="Must be at least 8 characters with uppercase, lowercase, and numbers"
              />

              {/* Password Requirements */}
              <Box sx={{ mt: 1, mb: 1, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                  Password Requirements:
                </Typography>
                <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
                  • At least 8 characters long<br />
                  • Contains uppercase letter (A-Z)<br />
                  • Contains lowercase letter (a-z)<br />
                  • Contains at least one number (0-9)
                </Typography>
              </Box>

              {/* Confirm New Password Field */}
              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirmNewPassword"
                type="password"
                value={formData.confirmNewPassword}
                onChange={handleInputChange}
                margin="normal"
                required
              />

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Set New Password'}
              </Button>
            </Box>
          ) : (
            /* Login Form */
            <Box component="form" onSubmit={handleLogin}>
              {/* Username Field */}
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                margin="normal"
                required
              />

              {/* Password Field */}
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                margin="normal"
                required
              />

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  'Access Dashboard'
                )}
              </Button>
            </Box>
          )}

          {/* Back to Chat Link */}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ textAlign: 'center' }}>
            <Link
              component="button"
              type="button"
              onClick={() => navigate('/')}
              color="text.secondary"
            >
              Back to Chat
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminLogin;