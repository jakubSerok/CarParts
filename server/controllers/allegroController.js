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
    
    // Validate and format images - Allegro expects an array of strings, not objects
    let formattedImages = [];
    if (Array.isArray(req.body.images)) {
      // Handle array of objects with url property
      if (typeof req.body.images[0] === 'object' && req.body.images[0].url) {
        formattedImages = req.body.images.map(img => {
          if (!img.url) {
            throw new Error('Invalid image format. URL is required.');
          }
          const url = img.url.trim();
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            throw new Error('Image URL must start with http:// or https://');
          }
          return url;
        });
      } 
      // Handle array of strings
      else if (typeof req.body.images[0] === 'string') {
        formattedImages = req.body.images.map(url => {
          const trimmedUrl = url.trim();
          if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
            throw new Error('Image URL must start with http:// or https://');
          }
          return trimmedUrl;
        });
      }
    }

    // Create a simplified request object with only essential fields
    // The Allegro API for product-offers expects a specific format
    const requestData = {
      name: req.body.name,
      category: { id: req.body.category.id },
      images: formattedImages,
      description: req.body.description,
      sellingMode: {
        format: "BUY_NOW",
        price: req.body.sellingMode?.price || { amount: "10.00", currency: "PLN" }
      },
      stock: {
        available: parseInt(req.body.stock?.available) || 1,
        unit: "UNIT"
      },
      location: {
        city: req.body.location?.city || "Warszawa",
        countryCode: "PL",
        postCode: req.body.location?.postCode || "00-001",
        province: req.body.location?.province || "MAZOWIECKIE"
      },
      delivery: {
        shippingRates: { id: req.body.delivery?.shippingRates?.id || "144979ca-6bac-4f06-9842-1b3e181cf6e4" },
        handlingTime: "PT24H"
      },
      publication: {
        duration: "P30D",
        status: "INACTIVE"
      }
    };
    
    // NIE przesyłaj żadnych parametrów w ofercie - wszystkie parametry są już przypisane do produktu
    // Allegro API nie pozwala na modyfikację parametrów w ofercie dla tej kategorii
    // Lista parametrów, które powodowały błędy:
    // - 13288: Marka
    // - 213906: Waga produktu
    // - 225693: EAN (GTIN)
    // - 224017: Kod producenta
    // - 7257: Wiek zwierzęcia
    // - 207486: Smak
    // - i prawdopodobnie inne
    
    // Usuwamy parameters z requestData, jeśli istnieje
    if (requestData.parameters) {
      delete requestData.parameters;
    }

    console.log('Sending to Allegro API:', JSON.stringify(requestData, null, 2));

    try {
      const response = await axios.post(`${process.env.ALLEGRO_API_URL}/sale/product-offers`,
        requestData,
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
      // Log the complete error response for debugging
      console.error('Błąd tworzenia oferty:', JSON.stringify(error.response?.data, null, 2));
      
      // Extract and log the metadata if available
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          if (err.metadata) {
            console.error('Error metadata:', JSON.stringify(err.metadata, null, 2));
          }
        });
      }
      
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
const getActiveOffers = async (req, res) => {
  try {
    const allegroToken = req.headers.authorization?.split(' ')[1];
    
    if (!allegroToken) {
      return res.status(401).json({ error: 'Brak tokenu Allegro' });
    }

    // Pobierz oferty z statusem ACTIVE
    const response = await axios.get(
      `${process.env.ALLEGRO_API_URL}/sale/offers`,
      {
        params: {
          'publication.status': 'ACTIVE',
          limit: 100 // Maksymalna liczba ofert do pobrania
        },
        headers: {
          'Authorization': `Bearer ${allegroToken}`,
          'Accept': 'application/vnd.allegro.public.v1+json'
        }
      }
    );

    // Przetwarzanie danych ofert
    const offers = response.data.offers.map(offer => ({
      id: offer.id,
      name: offer.name,
      primaryImage: offer.primaryImage,
      sellingMode: offer.sellingMode,
      stock: offer.stock,
      publication: offer.publication,
      category: offer.category
    }));

    res.json({ offers });
  } catch (error) {
    console.error('Błąd pobierania ofert:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.message || 'Błąd serwera',
      details: error.response?.data?.errors 
    });
  }
};
const updateOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { name, price } = req.body;
    const allegroToken = req.headers.authorization?.split(' ')[1];

    if (!allegroToken) {
      return res.status(401).json({ error: 'Brak tokenu Allegro' });
    }

    // Pobierz aktualną ofertę, aby zachować inne dane
    const getResponse = await axios.get(
      `${process.env.ALLEGRO_API_URL}/sale/offers/${offerId}`,
      {
        headers: {
          'Authorization': `Bearer ${allegroToken}`,
          'Accept': 'application/vnd.allegro.public.v1+json'
        }
      }
    );

    const currentOffer = getResponse.data;

    // Przygotuj zaktualizowaną ofertę
    const updatedOffer = {
      ...currentOffer,
      name: name,
      sellingMode: {
        ...currentOffer.sellingMode,
        price: {
          amount: price.amount,
          currency: price.currency || 'PLN'
        }
      }
    };

    // Wyślij aktualizację
    const response = await axios.put(
      `${process.env.ALLEGRO_API_URL}/sale/offers/${offerId}`,
      updatedOffer,
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
    console.error('Błąd aktualizacji oferty:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.message || 'Błąd serwera',
      details: error.response?.data?.errors 
    });
  }
};


// W eksporcie dodaj nową funkcję
module.exports = { 
  searchProducts, 
  getProductOffer, 
  createProductOffer,
  getActiveOffers, // Dodaj tę linię
  getAuthorizationUrl,
  getTokenFromCode,
  updateOffer
};