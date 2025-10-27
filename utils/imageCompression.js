const sharp = require('sharp');

/**
 * Compress image to target size while maintaining quality
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {number} targetSizeKB - Target file size in KB (default: 30KB)
 * @param {Object} options - Compression options
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
const compressImageToSize = async (imageBuffer, targetSizeKB = 30, options = {}) => {
    try {
        const targetSizeBytes = targetSizeKB * 1024;
        
        // Get original image metadata
        const metadata = await sharp(imageBuffer).metadata();
        const originalSizeKB = imageBuffer.length / 1024;
        
        console.log(`Original image: ${metadata.width}x${metadata.height}, ${originalSizeKB.toFixed(2)}KB`);
        
        // If already smaller than target, return as is
        if (imageBuffer.length <= targetSizeBytes) {
            console.log(`Image already under ${targetSizeKB}KB, no compression needed`);
            return imageBuffer;
        }

        // Default compression settings
        const defaultOptions = {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 80,
            format: 'jpeg'
        };
        
        const config = { ...defaultOptions, ...options };
        
        // Start with quality-based compression
        let compressedBuffer;
        let quality = config.quality;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            let sharpInstance = sharp(imageBuffer)
                .resize(config.maxWidth, config.maxHeight, {
                    fit: 'inside',
                    withoutEnlargement: true
                });
            
            // Apply format-specific compression
            if (config.format === 'jpeg' || config.format === 'jpg') {
                sharpInstance = sharpInstance.jpeg({ 
                    quality: quality,
                    progressive: true,
                    mozjpeg: true
                });
            } else if (config.format === 'webp') {
                sharpInstance = sharpInstance.webp({ 
                    quality: quality,
                    effort: 6
                });
            } else if (config.format === 'png') {
                sharpInstance = sharpInstance.png({ 
                    compressionLevel: 9,
                    quality: quality
                });
            }
            
            compressedBuffer = await sharpInstance.toBuffer();
            const compressedSizeKB = compressedBuffer.length / 1024;
            
            console.log(`Attempt ${attempts + 1}: Quality ${quality}, Size: ${compressedSizeKB.toFixed(2)}KB`);
            
            // Check if we've reached the target size
            if (compressedBuffer.length <= targetSizeBytes) {
                console.log(`✅ Target size achieved: ${compressedSizeKB.toFixed(2)}KB`);
                break;
            }
            
            // If still too large, reduce quality more aggressively
            if (compressedSizeKB > targetSizeKB * 1.5) {
                quality -= 15; // Aggressive reduction
            } else {
                quality -= 5; // Gradual reduction
            }
            
            // Don't go below minimum quality
            if (quality < 20) {
                // If quality is too low, try reducing dimensions further
                config.maxWidth = Math.floor(config.maxWidth * 0.8);
                config.maxHeight = Math.floor(config.maxHeight * 0.8);
                quality = 60; // Reset quality
                
                console.log(`Reducing dimensions to ${config.maxWidth}x${config.maxHeight}`);
            }
            
            attempts++;
        }
        
        const finalSizeKB = compressedBuffer.length / 1024;
        console.log(`Final compressed size: ${finalSizeKB.toFixed(2)}KB`);
        
        return compressedBuffer;
        
    } catch (error) {
        console.error('Error compressing image:', error);
        throw new Error(`Image compression failed: ${error.message}`);
    }
};

/**
 * Smart image compression that adapts based on image type and content
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {string} mimeType - Original image mime type
 * @param {number} targetSizeKB - Target file size in KB
 * @returns {Promise<{buffer: Buffer, mimeType: string}>} - Compressed image data
 */
const smartImageCompress = async (imageBuffer, mimeType, targetSizeKB = 30) => {
    try {
        const metadata = await sharp(imageBuffer).metadata();
        
        // Determine best output format
        let outputFormat = 'jpeg';
        let outputMimeType = 'image/jpeg';
        
        // Use WebP for better compression if supported
        if (mimeType.includes('png') && metadata.hasAlpha) {
            outputFormat = 'webp';
            outputMimeType = 'image/webp';
        } else if (mimeType.includes('png')) {
            // PNG without transparency can be converted to JPEG
            outputFormat = 'jpeg';
            outputMimeType = 'image/jpeg';
        }
        
        // Compress the image
        const compressedBuffer = await compressImageToSize(imageBuffer, targetSizeKB, {
            format: outputFormat,
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 85
        });
        
        return {
            buffer: compressedBuffer,
            mimeType: outputMimeType
        };
        
    } catch (error) {
        console.error('Smart compression error:', error);
        throw error;
    }
};

/**
 * Validate image file and compress if needed
 * @param {Object} file - Multer file object
 * @param {number} targetSizeKB - Target file size in KB
 * @returns {Promise<{buffer: Buffer, mimeType: string, originalSize: number, compressedSize: number}>}
 */
const processImageFile = async (file, targetSizeKB = 30) => {
    try {
        if (!file || !file.buffer) {
            throw new Error('Invalid file object');
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new Error(`Unsupported file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`);
        }
        
        const originalSize = file.buffer.length;
        const originalSizeKB = originalSize / 1024;
        
        console.log(`Processing image: ${file.originalname}, Original size: ${originalSizeKB.toFixed(2)}KB`);
        
        // Compress the image
        const { buffer: compressedBuffer, mimeType } = await smartImageCompress(
            file.buffer, 
            file.mimetype, 
            targetSizeKB
        );
        
        const compressedSize = compressedBuffer.length;
        const compressedSizeKB = compressedSize / 1024;
        const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        
        console.log(`Compression complete: ${compressedSizeKB.toFixed(2)}KB (${compressionRatio}% reduction)`);
        
        return {
            buffer: compressedBuffer,
            mimeType,
            originalSize,
            compressedSize
        };
        
    } catch (error) {
        console.error('Error processing image file:', error);
        throw error;
    }
};

module.exports = {
    compressImageToSize,
    smartImageCompress,
    processImageFile
};