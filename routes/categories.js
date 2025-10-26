const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// GET /categories - Get all categories
router.get('/', categoryController.getAllCategories);

// GET /categories/:id - Get category by ID
router.get('/:id', categoryController.getCategoryById);

// POST /categories - Create new category
router.post('/', categoryController.createCategory);

// PUT /categories/:id - Update category
router.put('/:id', categoryController.updateCategory);

// DELETE /categories/:id - Delete category
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;