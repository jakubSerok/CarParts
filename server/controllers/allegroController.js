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
    
    // Podstawowa struktura oferty zgodna z dokumentacją Allegro
    const allegroProduct = {
      name: req.body.name,
      category: {
        id: req.body.category.id
      },
      sellingMode: {
        format: req.body.sellingMode.format || 'BUY_NOW',
        price: {
          amount: req.body.sellingMode.price.amount.toString(), // Kwota jako string
          currency: req.body.sellingMode.price.currency || 'PLN'
        }
      },
      stock: {
        available: parseInt(req.body.stock.available) || 1
      },
      images: req.body.images.map(img => ({
        url: img.url
      })),
      // Wymagane pola z domyślnymi wartościami
      delivery: {
        shippingRates: {
          id: req.body.delivery?.shippingRates?.id || '0' // Wymagane, domyślna wartość
        },
        handlingTime: req.body.delivery?.handlingTime || 'PT24H' // Wymagane
      },
      publication: {
        duration: req.body.publication?.duration || 'PT72H', // Wymagane
        startingAt: req.body.publication?.startingAt || new Date().toISOString() // Opcjonalne
      },
      // Opis jako opcjonalny
      description: req.body.description ? {
        sections: [{
          items: [{
            type: 'TEXT',
            content: req.body.description.sections?.[0]?.items?.[0]?.content || ''
          }]
        }]
      } : undefined
    };

    console.log('Wysyłanie produktu do Allegro:', JSON.stringify(allegroProduct, null, 2));
    
    const response = await axios.post(`${process.env.ALLEGRO_API_URL}/sale/product-offers`, allegroProduct, {
      headers: {
        Authorization: `Bearer ${allegroToken}`,
        Accept: 'application/vnd.allegro.public.v1+json',
        'Content-Type': 'application/vnd.allegro.public.v1+json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Pełny błąd Allegro API:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.message || 'Błąd serwera',
      details: error.response?.data?.errors
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