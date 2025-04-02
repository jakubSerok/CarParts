const express = require('express');
const { searchProducts, createProduct } = require('../controllers/allegroController');

const router = express.Router();

router.get('/search', searchProducts);
router.post('/products', createProduct);

module.exports = router;
