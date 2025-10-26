const { getFirestore } = require('../config/firebase');

class CategoryController {
    
    // Get all categories
    async getAllCategories(req, res) {
        try {
            const db = getFirestore();
            const categoriesRef = db.collection('categories');
            
            // Get all documents from categories collection
            const snapshot = await categoriesRef.get();
            
            if (snapshot.empty) {
                return res.status(200).json({
                    success: true,
                    message: 'No categories found',
                    data: [],
                    count: 0
                });
            }

            const categories = [];
            snapshot.forEach(doc => {
                categories.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            res.status(200).json({
                success: true,
                message: 'Categories retrieved successfully',
                data: categories,
                count: categories.length
            });

        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch categories',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get category by ID
    async getCategoryById(req, res) {
        try {
            const { id } = req.params;
            const db = getFirestore();
            
            const categoryDoc = await db.collection('categories').doc(id).get();
            
            if (!categoryDoc.exists) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Category retrieved successfully',
                data: {
                    id: categoryDoc.id,
                    ...categoryDoc.data()
                }
            });

        } catch (error) {
            console.error('Error fetching category:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch category',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Create new category
    async createCategory(req, res) {
        try {
            const categoryData = req.body;
            const db = getFirestore();
            
            // Add timestamp
            categoryData.createdAt = new Date().toISOString();
            categoryData.updatedAt = new Date().toISOString();
            
            const docRef = await db.collection('categories').add(categoryData);
            
            res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: {
                    id: docRef.id,
                    ...categoryData
                }
            });

        } catch (error) {
            console.error('Error creating category:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create category',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Update category
    async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const db = getFirestore();
            
            // Add updated timestamp
            updateData.updatedAt = new Date().toISOString();
            
            const categoryRef = db.collection('categories').doc(id);
            const categoryDoc = await categoryRef.get();
            
            if (!categoryDoc.exists) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }
            
            await categoryRef.update(updateData);
            
            res.status(200).json({
                success: true,
                message: 'Category updated successfully',
                data: {
                    id: id,
                    ...updateData
                }
            });

        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update category',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Delete category
    async deleteCategory(req, res) {
        try {
            const { id } = req.params;
            const db = getFirestore();
            
            const categoryRef = db.collection('categories').doc(id);
            const categoryDoc = await categoryRef.get();
            
            if (!categoryDoc.exists) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }
            
            await categoryRef.delete();
            
            res.status(200).json({
                success: true,
                message: 'Category deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete category',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
}

module.exports = new CategoryController();