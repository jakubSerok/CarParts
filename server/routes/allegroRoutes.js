// allegroRouter.js
const express = require('express');
const router = express.Router();
const { fetchAllegroOffers, searchProducts, createOffer } = require('../services/allegroService');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/offers', async (req, res) => {
    try {
        const offers = await fetchAllegroOffers();
        if (!offers) {
            return res.status(500).json({ error: 'Failed to fetch offers from Allegro' });
        }
        res.json(offers);
    } catch (error) {
        console.error('Error in Allegro offers route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/products/search', authMiddleware, searchProducts);
router.post('/products/offers', authMiddleware, createOffer);

module.exports = router;