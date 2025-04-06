const axios = require('axios');
const qs = require('querystring');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');


const TOKEN_FILE = path.join(__dirname, 'allegro_token.json');

// Konfiguracja axios dla API Allegro
const allegroApi = axios.create({
  baseURL: process.env.ALLEGRO_API_URL,
  headers: {
    'Accept': 'application/vnd.allegro.public.v1+json',
    'Content-Type': 'application/json'
  }
});

// Funkcje do zarządzania tokenami
const saveToken = (tokenData) => {
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData));
    console.log('Token został pomyślnie zapisany.');
  } catch (err) {
    console.error('Błąd podczas zapisywania tokenu:', err);
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
    console.error('Błąd podczas wczytywania tokenu:', err);
    return null;
  }
};

// Generowanie URL do autoryzacji
const getAuthorizationUrl = () => {
  const params = {
    response_type: 'code',
    client_id: process.env.ALLEGRO_CLIENT_ID,
    redirect_uri: process.env.ALLEGRO_REDIRECT_URI,
    prompt: 'confirm'
  };
  
  return `https://allegro.pl.allegrosandbox.pl/auth/oauth/authorize?${qs.stringify(params)}`;
};

// Wymiana kodu autoryzacyjnego na token dostępu
const getTokenFromCode = async (code) => {
  // Blokada przed ponownym użyciem
  if (usedCodes.has(code)) {
    throw new Error('Kod autoryzacyjny już wykorzystany');
  }
  usedCodes.add(code);

  try {
    const authString = Buffer.from(`${process.env.ALLEGRO_CLIENT_ID}:${process.env.ALLEGRO_CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(
      `https://allegro.pl.allegrosandbox.pl/auth/oauth/token`,
      qs.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.ALLEGRO_REDIRECT_URI
      }),
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('Token otrzymany dla kodu:', code.slice(0, 6) + '...');
    return response.data;

  } catch (error) {
    // Usuń kod z Setu jeśli wystąpił błąd (opcjonalne)
    usedCodes.delete(code);
    throw error;
  }
};
// Odświeżanie tokenu
const refreshToken = async () => {
  const tokenData = loadToken();
  if (!tokenData || !tokenData.refresh_token) {
    // Dodaj bardziej szczegółowy komunikat
    throw new Error('Brak tokenu odświeżania - wymagana ponowna autoryzacja');
  }

  const authString = Buffer.from(`${process.env.ALLEGRO_CLIENT_ID}:${process.env.ALLEGRO_CLIENT_SECRET}`).toString('base64');

  try {
    const response = await axios.post(
      `https://allegro.pl.allegrosandbox.pl/auth/oauth/token`,
      qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token,
        redirect_uri: process.env.ALLEGRO_REDIRECT_URI
      }),
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const newTokenData = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token || tokenData.refresh_token,
      expires_at: Date.now() + (response.data.expires_in * 1000 - 30000)
    };
    
    saveToken(newTokenData);
    return newTokenData;
  } catch (error) {
    console.error('Błąd odświeżania tokenu:', error.response?.data || error.message);
    // Usuń nieaktualny token
    fs.unlinkSync(TOKEN_FILE);
    throw new Error('Autoryzacja wygasła - wymagane ponowne logowanie');
  }
};
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
      return res.status(401).json({ error: 'Brak tokenu autoryzacji' });
  }

  try {
      // Verify using RS256 algorithm
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
          algorithms: ['RS256']
      });
      req.user = decoded;
      next();
  } catch (error) {
      console.error('Błąd weryfikacji tokenu:', error);
      res.status(401).json({ 
          error: 'Nieprawidłowy token',
          details: error.message 
      });
  }
};

// Sprawdzanie i uzyskiwanie ważnego tokenu
const getValidToken = async () => {
  const tokenData = loadToken();
  
  if (!tokenData || !tokenData.access_token) {
    throw new Error('Brak tokenu - wymagana autoryzacja');
  }

  if (Date.now() >= tokenData.expires_at) {
    console.log('Token wygasł, odświeżanie...');
    try {
      const newTokenData = await refreshToken();
      return newTokenData.access_token;
    } catch (refreshError) {
      console.error('Nie udało się odświeżyć tokenu:', refreshError);
      // Dodaj więcej informacji dla użytkownika
      throw new Error('Sesja wygasła. Kliknij "Połącz z Allegro" aby odnowić dostęp.');
    }
  }
  
  return tokenData.access_token;
};

// Wywołanie API Allegro
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
    console.error('Błąd podczas wywoływania API:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  getAuthorizationUrl,
  getTokenFromCode,
  getValidToken,
  callAllegroApi,
  loadToken,
  verifyToken
};