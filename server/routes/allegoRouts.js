const express = require('express');
const { searchProducts, getProductOffer, createProductOffer } = require('../controllers/allegroController');

const router = express.Router();

router.get('/search', searchProducts);
router.get('/product-offers/:offerId', getProductOffer);
router.post('/product-offers', createProductOffer);

module.exports = router;