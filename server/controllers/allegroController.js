const axios = require('axios');
const { getValidToken, getAuthorizationUrl, getTokenFromCode } = require('../middleware/allegroAuth');



const searchProducts = async (req, res) => {
    try {
        const { phrase, limit = 20 } = req.query;
        
        if (!phrase) {
            return res.status(400).json({ error: 'Brak frazy wyszukiwania' });
        }
        
        const accessToken = req.headers.authorization.split(' ')[1]; // Zmiana tutaj
        const response = await axios.get(`${process.env.ALLEGRO_API_URL}/sale/products`, {
            params: {                
                phrase: phrase,
                limit: parseInt(limit),
                language: 'pl-PL'
            },
            headers: {
                'Authorization': `Bearer ${accessToken}`,
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
    const accessToken = await getValidToken();
    const response = await axios.get(`${process.env.ALLEGRO_API_URL}/sale/products/${offerId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
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
    const requiredFields = ['name', 'category', 'parameters', 'sellingMode', 'stock', 'description', 'images', 'delivery'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Brak wymaganych pól',
        missingFields
      });
    }

    const accessToken = await getValidToken();
    const allegroProduct = {
      name: req.body.name,
      category: { id: req.body.category.id },
      parameters: req.body.parameters,
      sellingMode: {
        format: req.body.sellingMode.format || 'BUY_NOW',
        price: {
          amount: req.body.sellingMode.price.amount,
          currency: req.body.sellingMode.price.currency || 'PLN'
        }
      },
      stock: { available: req.body.stock.available },
      description: {
        sections: [{
          items: [{
            type: 'TEXT',
            content: req.body.description.sections[0]?.items[0]?.content || ''
          }]
        }]
      },
      images: req.body.images.map(img => ({
        url: img.url.startsWith('http') ? img.url : `https://${img.url}`
      })).filter(img => img.url),
      delivery: {
        shippingRates: {
          id: req.body.delivery.shippingRates.id
        }
      }
    };

    console.log('Wysyłanie produktu do Allegro:', allegroProduct);
    const response = await axios.post(`${process.env.ALLEGRO_API_URL}/sale/product-offers`, allegroProduct, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.allegro.public.v1+json',
        'Content-Type': 'application/vnd.allegro.public.v1+json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Błąd Allegro API:', error.response?.data || error.message);
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