const axios = require('axios');
const { getValidToken  } = require('../middleware/allegroAuth');

const searchProducts = async (req, res) => {
    try {
        const { phrase, limit = 20 } = req.query;
        
        if (!phrase) {
            return res.status(400).json({ error: 'Brak frazy wyszukiwania' });
        }
        
        const accessToken = await getValidToken ();
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

const uploadImage = async (imageUrl, accessToken) => {
    try {
      console.log('Attempting to upload image from URL:', imageUrl); // Debug URL
      const response = await axios.post(`${process.env.ALLEGRO_UPLOAD_URL}/sale/images`, {
        url: imageUrl
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.allegro.public.v1+json',
          'Content-Type': 'application/vnd.allegro.public.v1+json'
        }
      });
      console.log('Upload response:', response.data); // Debug odpowiedzi
      return response.data;
    } catch (error) {
      console.error('Full upload error:', {
        status: error.response?.status,
        headers: error.response?.headers,
        data: error.response?.data,
        config: error.config
      });
      throw error;
    }
  };

const createProduct = async (req, res) => {
  try {
    const { tytul, cena, ilosc, opis, zdjecia, wybranyProdukt } = req.body;
    const accessToken = await getValidToken();

    // Upload images to Allegro
    const uploadedImages = await Promise.all(zdjecia.map(async url => {
      const uploadedImage = await uploadImage(url, accessToken);
      return { url: uploadedImage.location };
    }));

    const productData = {
      name: tytul,
      category: {
        id: wybranyProdukt?.category?.id || '954b95b6-43cf-4104-8354-dea4d9b10ddf'
      },
      parameters: wybranyProdukt?.parameters || [],
      images: uploadedImages,
      description: {
        sections: [{
          items: [{
            type: 'TEXT',
            content: opis
          }]
        }]
      },
      stock: {
        available: parseInt(ilosc)
      }
    };

    // Add sellingMode only if price is provided
    if (cena) {
      productData.sellingMode = {
        format: 'BUY_NOW',
        price: {
          amount: parseFloat(cena),
          currency: 'PLN'
        }
      };
    }

    const response = await axios.post(`${process.env.ALLEGRO_API_URL}/sale/offers`, productData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.allegro.public.v1+json',
        'Content-Type': 'application/vnd.allegro.public.v1+json'
      }
    });

    res.status(201).json(response.data);
  } catch (error) {
    console.error('Błąd tworzenia produktu:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.message || 'Błąd serwera',
      details: error.response?.data?.errors 
    });
  }
};

module.exports = { searchProducts, createProduct, uploadImage };