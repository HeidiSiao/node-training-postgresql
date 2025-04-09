const express = require('express');
const router = express.Router();

const isAuth = require('../middlewares/isAuth');
const handleErrorAsync = require ("../utils/handleErrorAsync");
const { postUploadImage } = require ("../controllers/upload");


router.post('/', isAuth, handleErrorAsync(postUploadImage));

module.exports = router;