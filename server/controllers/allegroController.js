const axios = require('axios');
const { getValidToken, getAuthorizationUrl, getTokenFromCode } = require('../middleware/allegroAuth');



const searchProducts = async (req, res) => {
  try {
    const { phrase, limit = 20 } = req.query;
    const allegroToken = req.headers.authorization?.split(' ')[1]; // Get Allegro token from header

    if (!allegroToken) {
      return res.status(401).json({ error: 'Brak tokenu Allegro' });
    }

    const response = await axios.get(`${process.env.ALLEGRO_API_URL}/sale/products`, {
      params: {                
        phrase: phrase,
        limit: parseInt(limit),
        language: 'pl-PL'
      },
      headers: {
        'Authorization': `Bearer ${allegroToken}`,
        'Accept': 'application/vnd.allegro.public.v1+json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Błąd wyszukiwania produktu:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.message || 'Błąd serwera',
      details: error.response?.data?.errors 
    });
  }
};

const getProductOffer = async (req, res) => {
  const { offerId } = req.params;
  console.log(offerId);
  try {
    const allegroToken = req.headers.authorization?.split(' ')[1]; // Get Allegro token from header
    const response = await axios.get(`${process.env.ALLEGRO_API_URL}/sale/products/${offerId}`, {
      headers: {
        Authorization: `Bearer ${allegroToken}`,
        Accept: 'application/vnd.allegro.public.v1+json'
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ message: error.message });
  }
};
const createProductOffer = async (req, res) => {
  try {
    // Podstawowe wymagane pola
    const requiredFields = ['name', 'category', 'sellingMode', 'stock', 'images'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Brak wymaganych pól',
        missingFields
      });
    }

    const allegroToken = req.headers.authorization?.split(' ')[1]; // Get Allegro token from header
    
    // Validate and format images
    const images = req.body.images.map(img => {
      if (!img.url) {
        throw new Error('Invalid image format. URL is required.');
      }
      const url = img.url.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error('Image URL must start with http:// or https://');
      }
      return url;
    });

    // Podstawowa struktura oferty zgodna z dokumentacją Allegro
    

    try {
      const response = await axios.post(`${process.env.ALLEGRO_API_URL}/sale/offers`,
        {
          ...req.body,
          id: undefined, // Ensure id is not sent
          language: 'pl-PL',
          
         
          
          
        },
        {
          headers: {
            'Authorization': `Bearer ${allegroToken}`,
            'Accept': 'application/vnd.allegro.public.v1+json',
            'Content-Type': 'application/vnd.allegro.public.v1+json'
          }
        }
      );
      res.json(response.data);
    } catch (error) {
      console.error('Błąd tworzenia oferty:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ 
        error: error.response?.data?.message || 'Błąd serwera',
        details: error.response?.data?.errors 
      });
    }
  } catch (error) {
    const status = error.response?.status || 500;
    const data = error.response?.data;
    const errors = data?.errors || [];
  
    console.error('Pełny błąd Allegro API:', {
      status,
      data,
      headers: error.response?.headers
    });
  
    // Tworzenie mapy błędów z informacjami o ścieżkach
    const errorDetails = errors.map(err => ({
      code: err.code,
      message: err.message,
      path: err.path || 'Nieokreślona ścieżka'
    }));
    console.error('Bład:', {
     errorDetails
    });
  
    res.status(status).json({
      error: data?.message || 'Błąd serwera',
      details: errorDetails
    });
  }
};

module.exports = { 
  searchProducts, 
  getProductOffer, 
  createProductOffer,
  getAuthorizationUrl,
  getTokenFromCode
};