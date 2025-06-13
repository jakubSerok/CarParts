const express = require('express');
const { 
  searchProducts, 
  getProductOffer, 
  createProductOffer,
  getActiveOffers,
  getAuthorizationUrl,
  getTokenFromCode,
  updateOffer
} = require('../controllers/allegroController');


const router = express.Router();

// Authentication endpoints (unchanged)
router.get('/auth', (req, res) => {
  const authUrl = getAuthorizationUrl();
  res.redirect(authUrl);
});

router.get('/auth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Brak kodu autoryzacyjnego' });
    }
    const tokenData = await getTokenFromCode(code);
    res.json({ success: true, token: tokenData.access_token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modified routes - removed verifyToken middleware
router.get('/search', searchProducts);
router.get('/product-offers/:offerId', getProductOffer);
router.post('/product-offers', createProductOffer);
router.get('/offers/active', getActiveOffers);
router.patch('/offers/:offerId', updateOffer);
module.exports = router;