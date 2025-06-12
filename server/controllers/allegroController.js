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

const stringifySafely = (obj) => {
  return JSON.stringify(obj, (key, value) => {
    if (['socket', 'req', 'res', '_headers'].includes(key)) return undefined;
    return value;
  });
};

const createProductOffer = async (req, res) => {
  console.log('Data from req: ', req.body);

  try {
    const { name, category, parameters, images, description, sellingMode, stock, location, language } = req.body;

    // List of unsupported properties in the request
    const unsupportedProperties = [
      'productSet.product.category.path',
      'productSet.product.category.similar',
      'productSet.product.parameters.options',
      'productSet.product.trustedContent',
      'hasProtectedBrand',
      'sellingMode',
      'stock',
      'delivery',
      'location',
      'valuesLabels',
      'unit',
      'offerRequirements',
      'description',
      'publication',
      'isDraft',
      'aiCoCreatedContent',
      'productSafety',
    ];

    // Function to recursively remove unsupported properties
    const removeUnsupportedProperties = (obj, path = '') => {
      for (let key in obj) {
        const fullPath = path ? `${path}.${key}` : key;

        if (unsupportedProperties.some(prop => fullPath.includes(prop))) {
          delete obj[key];
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          removeUnsupportedProperties(obj[key], fullPath);
        }
      }
    };

    const productData = {
      "productSet": [
        {
          product: { ...req.body },
          responsibleProducer: { ...req.body.productSafety.responsibleProducer[0] || NULL },
        }
      ],
      "sellingMode": {
        "format": sellingMode.format,
        "price": {
          "amount": sellingMode.price.amount,
          "currency": sellingMode.price.currency
        }
      },
      "description": description,
      "language": language || "pl-PL"
    };

    removeUnsupportedProperties(productData);

    console.log('Constructed product data:', productData); 

    const allegroToken = req.headers.authorization?.split(' ')[1];
    if (!allegroToken) {
      return res.status(401).json({ error: 'Missing Allegro token' });
    }

    console.log('Wysyłanie do Allegro:', JSON.stringify(productData));

    const response = await axios.post(
      `${process.env.ALLEGRO_API_URL}/sale/product-offers`,
      productData,
      {
        headers: {
          'Authorization': `Bearer ${allegroToken}`,
          'Accept': 'application/vnd.allegro.public.v1+json',
          'Content-Type': 'application/vnd.allegro.public.v1+json'
        }
      }
    );

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Błąd wystawiania produktu:', error.response?.data || error.message);

    if (error.response?.data?.metadata) {
      console.log('Error metadata:', JSON.stringify(error.response.data.metadata, null, 2));
    } else {
      console.log('Full error response:', JSON.stringify(error.response?.data, null, 2));
    }

    if (!res.headersSent) {
      res.status(error.response?.status || 500).json({
        error: error.response?.data?.message || 'Internal server error',
        details: error.response?.data?.errors || error.message
      });
    }
  }
};

const uploadImageToAllegro = async (url, allegroToken) => {
  try {
    const response = await axios.post(
      `${process.env.ALLEGRO_API_URL}/sale/images`,
      { url },
      {
        headers: {
          'Authorization': `Bearer ${allegroToken}`,
          'Accept': 'application/vnd.allegro.public.v1+json',
          'Content-Type': 'application/vnd.allegro.public.v1+json'
        }
      }
    );
    return response.data.url; // zwraca już gotowy URL Allegro
  } catch (error) {
    console.error(`Błąd podczas uploadu obrazu do Allegro (${url}):`, error.response?.data || error.message);
    throw new Error('Nie udało się przesłać obrazu do Allegro');
  }
};


module.exports = {
  searchProducts,
  getProductOffer,
  createProductOffer,
  getAuthorizationUrl,
  getTokenFromCode
};