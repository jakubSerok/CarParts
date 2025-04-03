const axios = require('axios');
const qs = require('querystring');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const allegroApi = axios.create({
  baseURL: process.env.ALLEGRO_API_URL,
  headers: {
    'Accept': 'application/vnd.allegro.public.v1+json',
    'Content-Type': 'application/json'
  }
});

const TOKEN_FILE = path.join(__dirname, 'allegro_token.json');

const saveToken = (tokenData) => {
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData));
    console.log('Token saved successfully');
  } catch (err) {
    console.error('Error saving token:', err);
  }
};

const loadToken = () => {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const data = fs.readFileSync(TOKEN_FILE, 'utf8');
      return JSON.parse(data);
    }
    return null;
  } catch (err) {
    console.error('Error loading token:', err);
    return null;
  }
};

const getAuthUrl = () => {
  return `https://allegro.pl.allegrosandbox.pl/auth/oauth/authorize?response_type=code&client_id=${process.env.ALLEGRO_CLIENT_ID}&redirect_uri=${process.env.ALLEGRO_REDIRECT_URI}`;
};

const getAccessToken = async () => {
  const authString = Buffer.from(`${process.env.ALLEGRO_CLIENT_ID}:${process.env.ALLEGRO_CLIENT_SECRET}`).toString('base64');

  try {
    const response = await axios.post(
      'https://allegro.pl.allegrosandbox.pl/auth/oauth/token',
      qs.stringify({
        grant_type: 'client_credentials',
        scope: 'allegro:api:sale:offers:read allegro:api:sale:offers:write'
      }),
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (!response.data.access_token) {
      throw new Error('No access token in response');
    }

    const tokenData = {
      access_token: response.data.access_token,
      expires_at: Date.now() + (response.data.expires_in * 1000 - 30000) // 30s buffer
    };
    
    saveToken(tokenData);
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting access token:', error.response?.data || error.message);
    throw error;
  }
};


const refreshToken = async (refreshToken) => {
  const authString = Buffer.from(`${process.env.ALLEGRO_CLIENT_ID}:${process.env.ALLEGRO_CLIENT_SECRET}`).toString('base64');

  try {
    const response = await axios.post(
      'https://allegro.pl.allegrosandbox.pl/auth/oauth/token',
      qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }),
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (!response.data.access_token) {
      throw new Error('No access token in response');
    }

    const tokenData = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_at: Date.now() + (response.data.expires_in * 1000 - 30000)
    };
    
    saveToken(tokenData);
    return tokenData;
  } catch (error) {
    console.error('Error refreshing token:', error.response?.data || error.message);
    throw error;
  }
};

const getValidToken = async () => {
  const tokenData = loadToken();
  
  // Jeśli token nie istnieje lub jest przeterminowany (z 30-sekundowym buforem)
  if (!tokenData || !tokenData.access_token || Date.now() >= tokenData.expires_at) {
    console.log('Token expired or not found, requesting new one');
    try {
      return await getAccessToken();
    } catch (error) {
      console.error('Failed to get new token:', error);
      throw error;
    }
  }
  
  console.log('Using existing token');
  return tokenData.access_token;
};

const callAllegroApi = async (endpoint, method = 'GET', data = null, additionalConfig = {}) => {
  const token = await getValidToken();
  
  try {
      const config = {
          method,
          url: endpoint,
          headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.allegro.public.v1+json',
              ...(method === 'POST' && { 'Content-Type': 'application/vnd.allegro.public.v1+json' })
          },
          ...additionalConfig
      };
      
      if (data) {
          config.data = data;
      }
      
      const response = await allegroApi(config);
      return response.data;
  } catch (error) {
      console.error('API call failed:', error.response?.data || error.message);
      throw error;
  }
};
const checkAuthStatus = async (req, res) => {
  try {
    const tokenData = loadToken();
    if (!tokenData || !tokenData.access_token) {
      return res.json({ authenticated: false });
    }

    // Opcjonalnie: możesz zweryfikować token z Allegro
    const decoded = jwt.decode(tokenData.access_token);
    if (!decoded) {
      return res.json({ authenticated: false });
    }

    res.json({ 
      authenticated: true,
      expiresAt: tokenData.expires_at
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.status(500).json({ authenticated: false });
  }
};

module.exports = {
  getAuthUrl,
  getAccessToken,
  getValidToken,
  callAllegroApi,
  checkAuthStatus
};