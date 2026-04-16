const express = require('express');
const router = express.Router();
const {addProductController, getAllProductsController, 
      getSingleProductController, updateProductController, deleteProductController} = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage()
})

router.post('/add-product', authMiddleware, upload.array('images'), addProductController)
router.get('/all-products', getAllProductsController)
router.get('/get-single-product/:id', getSingleProductController)
router.put('/update-product/:id', authMiddleware, upload.array('images'), updateProductController)
router.delete('/delete-product/:id',authMiddleware, deleteProductController)

module.exports = router;