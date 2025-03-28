// allegroService.js
const axios = require('axios');
const { getAllegroToken } = require('./allegroAuth');

const fetchAllegroOffers = async () => {
    const token = await getAllegroToken();
    if (!token) {
        console.error('Access token missing');
        return null;
    }

    try {
        const response = await axios.get(`${process.env.ALLEGRO_API_URL}/offers/listing`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.allegro.public.v1+json'
            },
            params: {
                limit: 10 // Limit to 10 offers for testing
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching offers:', error.response ? error.response.data : error.message);
        return null;
    }
};

const getOfferDetails = async (offerId) => {
    const token = await getAllegroToken();
    if (!token) {
        console.error('Access token missing');
        return null;
    }

    try {
        const response = await axios.get(`${process.env.ALLEGRO_API_URL}/offers/${offerId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.allegro.public.v1+json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching offer details:', error.response ? error.response.data : error.message);
        return null;
    }
};

const searchProducts = async (req, res) => {
  const { q } = req.query;
  const token = await getAllegroToken();

  try {
    const response = await axios.get(`${process.env.ALLEGRO_API_URL}/offers`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.allegro.public.v1+json'
      },
      params: {
        phrase: q,
        limit: 10
      }
    });
    res.json(response.data.offers);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
};

const createOffer = async (req, res) => {
  const { productId, price, quantity, description } = req.body;
  const token = await getAllegroToken();

  try {
    const response = await axios.post(`${process.env.ALLEGRO_API_URL}/offers`, {
      product: {
        id: productId
      },
      sellingMode: {
        price: {
          amount: price,
          currency: 'PLN'
        }
      },
      stock: {
        available: quantity
      },
      description: {
        sections: [
          {
            items: [
              {
                type: 'TEXT',
                content: description
              }
            ]
          }
        ]
      }
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.allegro.public.v1+json',
        'Content-Type': 'application/vnd.allegro.public.v1+json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ error: 'Failed to create offer' });
  }
};

module.exports = {
  fetchAllegroOffers,
  getOfferDetails,
  searchProducts,
  createOffer
};