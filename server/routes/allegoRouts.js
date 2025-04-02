const express = require('express');
const { searchProducts } = require('../controllers/allegroController');

const router = express.Router();

router.get('/search', searchProducts);

module.exports = router;
