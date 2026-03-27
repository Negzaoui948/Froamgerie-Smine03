const express = require('express');
const router = express.Router();
const Product = require('../../models/Product');

// Create - Ajouter un produit
router.post('/add_Product', async (req, res) => {
    try {
        const product = new Product(req.body);
        const savedProduct = await product.save();
        res.status(201).json(savedProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Read - Tous les produits
router.get('/AllProducts', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Read - Produit par ID
router.get('/Product/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Produit non trouvé" });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update - Modifier un produit
router.put('/Product/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedProduct) return res.status(404).json({ message: "Produit non trouvé" });
        res.json(updatedProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete - Supprimer un produit
router.delete('/Product/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ message: "Produit non trouvé" });
        res.json({ message: "Produit supprimé" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
