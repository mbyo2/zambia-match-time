/**
 * Enhanced file validation with security checks
 */

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

// Allowed MIME types for different file categories
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime'
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB

// Dangerous file extensions that should never be allowed
const DANGEROUS_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'scr', 'pif', 'vbs', 'js', 
  'jar', 'com', 'lnk', 'reg', 'msi', 'dll', 'sys'
];

/**
 * Validates file for security and compliance
 */
export const validateSecureFile = async (
  file: File, 
  category: 'image' | 'video' | 'document'
): Promise<FileValidationResult> => {
  try {
    // Basic validation
    if (!file || !file.name) {
      return { isValid: false, error: 'Invalid file provided' };
    }

    // Check file extension for dangerous types
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension && DANGEROUS_EXTENSIONS.includes(extension)) {
      return { isValid: false, error: 'File type not allowed for security reasons' };
    }

    // Category-specific validation
    let allowedTypes: string[];
    let maxSize: number;

    switch (category) {
      case 'image':
        allowedTypes = ALLOWED_IMAGE_TYPES;
        maxSize = MAX_IMAGE_SIZE;
        break;
      case 'video':
        allowedTypes = ALLOWED_VIDEO_TYPES;
        maxSize = MAX_VIDEO_SIZE;
        break;
      case 'document':
        allowedTypes = ALLOWED_DOCUMENT_TYPES;
        maxSize = MAX_DOCUMENT_SIZE;
        break;
      default:
        return { isValid: false, error: 'Invalid file category' };
    }

    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}` 
      };
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return { 
        isValid: false, 
        error: `File size too large. Maximum allowed: ${maxSizeMB}MB` 
      };
    }

    // Check for suspicious filename patterns
    const suspiciousPatterns = [
      /[<>:"/\\|?*]/,  // Windows reserved characters
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,  // Windows reserved names
      /\.(exe|bat|cmd|scr|pif|vbs|js)$/i  // Executable extensions
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
      return { isValid: false, error: 'Filename contains invalid characters or patterns' };
    }

    // Additional validation for images
    if (category === 'image') {
      const imageValidation = await validateImageFile(file);
      if (!imageValidation.isValid) {
        return imageValidation;
      }
    }

    return { isValid: true };

  } catch (error) {
    console.error('File validation error:', error);
    return { isValid: false, error: 'File validation failed' };
  }
};

/**
 * Enhanced image validation with header checks
 */
const validateImageFile = async (file: File): Promise<FileValidationResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        
        // Check file headers for common image formats
        const isValidJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
        const isValidPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
        const isValidWebP = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
        
        if (!isValidJPEG && !isValidPNG && !isValidWebP) {
          resolve({ isValid: false, error: 'Invalid image file format' });
          return;
        }
        
        resolve({ isValid: true });
      } catch (error) {
        resolve({ isValid: false, error: 'Failed to validate image file' });
      }
    };
    
    reader.onerror = () => {
      resolve({ isValid: false, error: 'Failed to read file' });
    };
    
    // Read first 12 bytes for header validation
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
};

/**
 * Generates secure filename to prevent path traversal attacks
 */
export const generateSecureFilename = (originalName: string, userId: string): string => {
  // Remove any path components and dangerous characters
  const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const extension = cleanName.split('.').pop()?.toLowerCase() || '';
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  
  return `${userId}_${timestamp}_${randomSuffix}.${extension}`;
};