const express = require('express');
const { searchProducts, getProductOffer, createProductOffer } = require('../controllers/allegroController');
const { getAuthUrl, getAccessToken, checkAuthStatus } = require('../middleware/allegroAuth');

const router = express.Router();

// Endpointy autoryzacji
router.get('/auth', (req, res) => {
  res.redirect(getAuthUrl());
});

router.get('/auth/status', checkAuthStatus); // Zmieniona nazwa endpointu na /auth/status

router.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('Authorization code missing');
  }

  try {
    await getAccessToken(code);
    res.redirect(process.env.FRONTEND_REDIRECT_URI || '/');
  } catch (error) {
    console.error('Error during callback:', error);
    res.status(500).send('Authentication failed');
  }
});

// Endpointy API
router.get('/search', searchProducts);
router.get('/product-offers/:offerId', getProductOffer);
router.post('/product-offers', createProductOffer);

module.exports = router;