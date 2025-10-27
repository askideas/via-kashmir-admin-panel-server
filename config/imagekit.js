const ImageKit = require('imagekit');

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

// Function to upload file to ImageKit
const uploadToImageKit = async (file, fileName, folder) => {
    try {
        const imageKit = getImageKit();
        
        const uploadResult = await imageKit.upload({
            file: file.buffer, // Buffer from multer
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
                thumbnailUrl: uploadResult.thumbnailUrl
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