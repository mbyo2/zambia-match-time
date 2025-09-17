import DOMPurify from 'dompurify';

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input - The user input to sanitize
 * @param options - DOMPurify configuration options
 * @returns Sanitized string safe for rendering
 */
export const sanitizeInput = (
  input: string, 
  options: any = {}
): string => {
  // Default configuration for maximum security
  const defaultConfig = {
    // Remove all HTML tags by default for text content
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    // Remove javascript: and data: protocols
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
    // Additional security measures
    KEEP_CONTENT: true,
    ...options
  };

  // Sanitize the input and convert to string
  const sanitized = String(DOMPurify.sanitize(input.trim(), defaultConfig));
  
  // Additional length validation
  if (sanitized.length > 2000) {
    throw new Error('Message too long. Maximum 2000 characters allowed.');
  }

  return sanitized;
};

/**
 * Sanitizes HTML content while preserving safe formatting
 * @param html - HTML content to sanitize
 * @returns Safe HTML string
 */
export const sanitizeHTML = (html: string): string => {
  const config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
    FORBID_ATTR: ['style', 'class'],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'iframe']
  };

  return String(DOMPurify.sanitize(html, config));
};

/**
 * Validates and sanitizes message content
 * @param message - Message content to validate
 * @returns Sanitized message or throws error
 */
export const validateMessage = (message: string): string => {
  if (!message || typeof message !== 'string') {
    throw new Error('Message content is required');
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    throw new Error('Message cannot be empty');
  }

  if (trimmed.length > 2000) {
    throw new Error('Message too long. Maximum 2000 characters allowed.');
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(trimmed))) {
    throw new Error('Message contains invalid content');
  }

  return sanitizeInput(trimmed);
};