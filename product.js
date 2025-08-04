const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const multer = require('multer');
const fs = require('fs');
const imagekit = require('../utils/imagekit');

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Read all products (Index)
router.get('/products', async (req, res) => {
    const products = await Product.find({});
    res.render('products/index', { products, title: 'Products' });
});

// Create product form
router.get('/products/new', isLoggedIn, (req, res) => {
    res.render('products/create', { title: 'New Product' });
});

// Create product POST route
router.post('/products', isLoggedIn, upload.single('productImage'), async (req, res) => {
    const { name, description, price } = req.body;
    const file = req.file;

    if (!file) {
        return res.render('products/create', { error: 'Image file is required.' });
    }

    try {
        const result = await imagekit.upload({
            file: fs.readFileSync(file.path),
            fileName: file.originalname,
            folder: '/ecommerce-images' // Optional: create a folder
        });

        fs.unlinkSync(file.path); // Delete local file after upload

        const newProduct = new Product({
            name,
            description,
            price,
            imageUrl: result.url,
            imageFileId: result.fileId
        });

        await newProduct.save();
        res.redirect('/products');
    } catch (err) {
        console.error(err);
        res.render('products/create', { error: 'Product creation failed.' });
    }
});

// Edit product form
router.get('/products/:id/edit', isLoggedIn, async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).send('Product not found');
    }
    res.render('products/edit', { product, title: 'Edit Product' });
});

// Update product PUT route
router.put('/products/:id', isLoggedIn, upload.single('productImage'), async (req, res) => {
    const { name, description, price } = req.body;
    const file = req.file;

    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        // If a new image is uploaded, delete the old one from ImageKit
        if (file) {
            await imagekit.deleteFile(product.imageFileId);
            const result = await imagekit.upload({
                file: fs.readFileSync(file.path),
                fileName: file.originalname,
                folder: '/ecommerce-images'
            });
            fs.unlinkSync(file.path);
            product.imageUrl = result.url;
            product.imageFileId = result.fileId;
        }

        product.name = name;
        product.description = description;
        product.price = price;

        await product.save();
        res.redirect('/products');
    } catch (err) {
        console.error(err);
        res.render('products/edit', { error: 'Product update failed.', product });
    }
});

// Delete product DELETE route
router.delete('/products/:id', isLoggedIn, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            await imagekit.deleteFile(product.imageFileId);
            await Product.deleteOne({ _id: req.params.id });
        }
        res.redirect('/products');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting product');
    }
});

module.exports = router;