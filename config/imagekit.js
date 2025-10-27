const ImageKit = require('imagekit');
const { processImageFile } = require('../utils/imageCompression');

let imagekit = null;

const initializeImageKit = () => {
    try {
        if (!imagekit) {
            // Check if all required environment variables are present
            if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
                console.warn('⚠️  ImageKit credentials not found in environment variables');
                return;
            }

            imagekit = new ImageKit({
                publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
                privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
                urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
            });
            console.log('✅ ImageKit initialized successfully');
        }
    } catch (error) {
        console.error('❌ Error initializing ImageKit:', error.message);
        // Don't throw error in serverless environments
        console.warn('⚠️  ImageKit initialization failed, file upload features will be disabled');
    }
};

const getImageKit = () => {
    if (!imagekit) {
        throw new Error('ImageKit is not initialized. Please check your ImageKit credentials in environment variables.');
    }
    return imagekit;
};

// Function to upload file to ImageKit with compression
const uploadToImageKit = async (file, fileName, folder, options = {}) => {
    try {
        const imageKit = getImageKit();
        
        // Default compression settings
        const defaultOptions = {
            compressImages: true,
            targetSizeKB: 30,
            preserveOriginal: false
        };
        
        const config = { ...defaultOptions, ...options };
        
        let uploadBuffer = file.buffer;
        let uploadMimeType = file.mimetype;
        let compressionStats = null;
        
        // Compress image if it's an image file and compression is enabled
        if (config.compressImages && file.mimetype.startsWith('image/')) {
            try {
                console.log(`📸 Compressing image before upload: ${fileName}`);
                const compressionResult = await processImageFile(file, config.targetSizeKB);
                
                uploadBuffer = compressionResult.buffer;
                uploadMimeType = compressionResult.mimeType;
                
                compressionStats = {
                    originalSize: compressionResult.originalSize,
                    compressedSize: compressionResult.compressedSize,
                    compressionRatio: ((compressionResult.originalSize - compressionResult.compressedSize) / compressionResult.originalSize * 100).toFixed(1)
                };
                
                console.log(`✅ Image compressed: ${(compressionResult.originalSize/1024).toFixed(2)}KB → ${(compressionResult.compressedSize/1024).toFixed(2)}KB (${compressionStats.compressionRatio}% reduction)`);
                
            } catch (compressionError) {
                console.error('Image compression failed, uploading original:', compressionError.message);
                // If compression fails, use original file
                uploadBuffer = file.buffer;
                uploadMimeType = file.mimetype;
            }
        }
        
        const uploadResult = await imageKit.upload({
            file: uploadBuffer,
            fileName: fileName,
            folder: folder,
            useUniqueFileName: false,
            overwriteFile: true
        });

        return {
            success: true,
            data: {
                url: uploadResult.url,
                fileId: uploadResult.fileId,
                filePath: uploadResult.filePath,
                thumbnailUrl: uploadResult.thumbnailUrl,
                compression: compressionStats
            }
        };
    } catch (error) {
        console.error('Error uploading to ImageKit:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Function to delete file from ImageKit
const deleteFromImageKit = async (fileId) => {
    try {
        const imageKit = getImageKit();
        await imageKit.deleteFile(fileId);
        return { success: true };
    } catch (error) {
        console.error('Error deleting from ImageKit:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    initializeImageKit,
    getImageKit,
    uploadToImageKit,
    deleteFromImageKit
};