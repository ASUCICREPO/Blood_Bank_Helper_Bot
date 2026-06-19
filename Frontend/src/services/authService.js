/**
 * Simple Cognito Authentication Service
 * Handles login and token management for admin users
 */

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
} from '@aws-sdk/client-cognito-identity-provider';

// Cognito configuration from environment variables
const config = {
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
  userPoolId: process.env.REACT_APP_USER_POOL_ID,
  clientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
};

// Validate configuration
if (!config.userPoolId || !config.clientId) {
  // Cognito configuration missing. Admin authentication will not work.
}

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: config.region,
});

class AuthService {
  // Sign in existing admin user
  async signIn(username, password) {
    if (!config.userPoolId || !config.clientId) {
      return {
        success: false,
        error: 'Cognito configuration not available. Please deploy the backend first.',
      };
    }

    try {
      const command = new InitiateAuthCommand({
        ClientId: config.clientId,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      });

      const response = await cognitoClient.send(command);
      
      // Handle new password required challenge (temporary password)
      if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        return {
          success: false,
          challengeName: 'NEW_PASSWORD_REQUIRED',
          session: response.Session,
          username: username,
          error: 'You must set a new password before continuing.'
        };
      }
      
      // Normal successful authentication
      if (response.AuthenticationResult) {
        const tokens = {
          accessToken: response.AuthenticationResult.AccessToken,
          idToken: response.AuthenticationResult.IdToken,
          refreshToken: response.AuthenticationResult.RefreshToken,
        };
        
        // Store tokens in localStorage
        this.storeTokens(tokens);
        
        return {
          success: true,
          tokens,
        };
      }
      
      return {
        success: false,
        error: 'Authentication failed',
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  // Handle new password challenge
  async setNewPassword(username, newPassword, session) {
    if (!config.userPoolId || !config.clientId) {
      return {
        success: false,
        error: 'Cognito configuration not available.',
      };
    }

    try {
      const command = new RespondToAuthChallengeCommand({
        ClientId: config.clientId,
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        Session: session,
        ChallengeResponses: {
          USERNAME: username,
          NEW_PASSWORD: newPassword,
        },
      });

      const response = await cognitoClient.send(command);
      
      if (response.AuthenticationResult) {
        const tokens = {
          accessToken: response.AuthenticationResult.AccessToken,
          idToken: response.AuthenticationResult.IdToken,
          refreshToken: response.AuthenticationResult.RefreshToken,
        };
        
        // Store tokens in localStorage
        this.storeTokens(tokens);
        
        return {
          success: true,
          tokens,
        };
      }
      
      return {
        success: false,
        error: 'Failed to set new password',
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  // Store tokens in localStorage
  storeTokens(tokens) {
    localStorage.setItem('adminTokens', JSON.stringify(tokens));
  }

  // Get stored tokens
  getStoredTokens() {
    const tokens = localStorage.getItem('adminTokens');
    return tokens ? JSON.parse(tokens) : null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    const tokens = this.getStoredTokens();
    if (!tokens || !tokens.accessToken) {
      return false;
    }

    // Simple token expiry check (JWT tokens have exp claim)
    try {
      const payload = JSON.parse(atob(tokens.accessToken.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // Sign out user
  signOut() {
    localStorage.removeItem('adminTokens');
  }

  // Get user info from stored ID token
  getUserInfo() {
    const tokens = this.getStoredTokens();
    if (!tokens || !tokens.idToken) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(tokens.idToken.split('.')[1]));
      return {
        username: payload['cognito:username'],
        email: payload.email,
        name: payload.name,
      };
    } catch (error) {
      return null;
    }
  }

  // Helper method to get user-friendly error messages
  getErrorMessage(error) {
    switch (error.name) {
      case 'UserNotFoundException':
        return 'User not found. Please check your username.';
      case 'NotAuthorizedException':
        return 'Incorrect username or password.';
      case 'UserNotConfirmedException':
        return 'Please contact administrator to activate your account.';
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  }
}

const authService = new AuthService();
export default authService;