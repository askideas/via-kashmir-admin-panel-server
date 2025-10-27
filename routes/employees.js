const express = require('express');
const multer = require('multer');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { verifyToken } = require('../middleware/auth');

// Apply authentication middleware to all employee routes
router.use(verifyToken);

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory as Buffer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file (before compression)
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Only image files are allowed! Supported formats: ${allowedTypes.join(', ')}`), false);
        }
    }
});

// Configure specific fields for file uploads
const uploadFields = upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'governmentProof', maxCount: 1 }
]);

// POST /employees - Add new employee with file uploads
router.post('/', uploadFields, employeeController.addEmployee);

// GET /employees - Get all employees
router.get('/', employeeController.getAllEmployees);

// GET /employees/:id - Get employee by ID
router.get('/:id', employeeController.getEmployeeById);

// PUT /employees/:id - Update employee
router.put('/:id', employeeController.updateEmployee);

// DELETE /employees/:id - Delete employee (soft delete)
router.delete('/:id', employeeController.deleteEmployee);

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size allowed is 10MB (will be compressed to ~30KB during upload).',
                error: 'FILE_SIZE_LIMIT'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Only one file per field is allowed.',
                error: 'FILE_COUNT_LIMIT'
            });
        }
    }
    
    if (error.message.includes('Only image files are allowed!')) {
        return res.status(400).json({
            success: false,
            message: 'Invalid file format. Supported formats: JPEG, JPG, PNG, WebP',
            error: 'INVALID_FILE_TYPE'
        });
    }
    
    next(error);
});

module.exports = router;