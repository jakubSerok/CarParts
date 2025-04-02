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

module.exports = { searchProducts };