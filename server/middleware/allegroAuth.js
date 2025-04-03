const axios = require('axios');
const qs = require('querystring');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Poprawiona konfiguracja axios - baseURL nie powinien zawierać '/auth/oauth/token'
const allegroApi = axios.create({
  baseURL: process.env.ALLEGRO_API_URL,
  headers: {
    'Accept': 'application/vnd.allegro.public.v1+json',
    'Content-Type': 'application/json' // Zmienione na application/json dla większości zapytań
  }
});

const TOKEN_FILE = path.join(__dirname, 'allegro_token.json');

const saveToken = (tokenData) => {
  // Dodaję obsługę błędów zapisu
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

const getAccessToken = async () => {
  const authString = Buffer.from(`${process.env.ALLEGRO_CLIENT_ID}:${process.env.ALLEGRO_CLIENT_SECRET}`).toString('base64');

  try {
    const response = await axios.post(
      'https://allegro.pl.allegrosandbox.pl/auth/oauth/token',
      qs.stringify({
        grant_type: 'client_credentials',
        scope: 'allegro:api:sale:offers:read allegro:api:sale:offers:write allegro:api:orders:write allegro:api:orders:read'
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
      expires_at: Date.now() + (response.data.expires_in * 1000 - 30000)
    };
    
    saveToken(tokenData);
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting access token:', error.response?.data || error.message);
    throw error;
  }
};

const decodeToken = (token) => {
  try {
    const decoded = jwt.decode(token);
  
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

const getValidToken = async () => {
  const tokenData = loadToken();
  
  // Check if token exists and is not expired (with 30s buffer)
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
  // Verify the token is still valid
  const decoded = decodeToken(tokenData.access_token);
  if (!decoded) {
    console.log('Token invalid, requesting new one');
    return await getAccessToken();
  }
  
  return tokenData.access_token;
};

// Przykładowa funkcja do wywołania API
const callAllegroApi = async (endpoint, method = 'GET', data = null) => {
  const token = await getValidToken();
  
  try {
    const config = {
      method,
      url: endpoint,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.allegro.public.v1+json'
      }
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

module.exports = {
  getValidToken,
  getAccessToken,
  callAllegroApi
};