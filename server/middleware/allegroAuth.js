const axios = require('axios');
const qs = require('querystring');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

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
  // W Allegro wymagane jest podanie nagłówka Authorization z Basic Auth
  const authString = Buffer.from(`${process.env.ALLEGRO_CLIENT_ID}:${process.env.ALLEGRO_CLIENT_SECRET}`).toString('base64');

  try {
    // Używamy osobnego axios dla tokena, bo wymaga innych nagłówków
    const response = await axios.post(
      'https://allegro.pl.allegrosandbox.pl/auth/oauth/token', // Pełny URL do token endpoint
      qs.stringify({
        grant_type: 'client_credentials'
      }),
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded' // Tylko dla tokena
        }
      }
    );

    if (!response.data.access_token) {
      throw new Error('No access token in response');
    }

    const tokenData = {
      access_token: response.data.access_token, // Zmiana nazwy na zgodną z Allegro
      expires_at: Date.now() + (response.data.expires_in * 1000 - 30000) // Odliczamy 30s marginesu
    };
    
    saveToken(tokenData);
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting access token:', error.response?.data || error.message);
    throw error;
  }
};

const getValidToken = async () => {
  const tokenData = loadToken();
  
  // Sprawdzamy czy token istnieje i czy nie wygasł (z marginesem 30s)
  if (!tokenData || !tokenData.access_token || Date.now() >= tokenData.expires_at) {
    console.log('Token expired or not found, requesting new one');
    return await getAccessToken();
  }
  
  console.log('Using existing token');
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