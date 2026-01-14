import * as cheerio from 'cheerio';
import { securityManager } from './security';
import { z } from 'zod';

// Custom error types for validation
export class ValidationError extends Error {
  constructor(
    public field: string,
    public message: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SecurityError extends Error {
  constructor(
    public message: string,
    public severity: 'low' | 'medium' | 'high' | 'critical'
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

// Input schemas using Zod
export const userSchemas = {
  email: z.string().email('Invalid email address'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters')
};

export const storySchemas = {
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters')
    .regex(/^[^<>"'&]*$/, 'Title contains invalid characters'),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content must be at most 50,000 characters'),
  genre: z.string()
    .min(1, 'Genre is required')
    .max(50, 'Genre must be at most 50 characters'),
  tags: z.array(z.string())
    .max(10, 'Maximum 10 tags allowed')
    .refine(tags => tags.every(tag => tag.length <= 20), 'Each tag must be at most 20 characters'),
  isPublic: z.boolean().optional()
};

export const apiSchemas = {
  apiKey: z.string().regex(/^[a-zA-Z0-9_-]{32,}$/, 'Invalid API key format'),
  deviceId: z.string().uuid('Invalid device ID'),
  pushToken: z.string().min(10, 'Invalid push token'),
  storyId: z.string().regex(/^[a-zA-Z0-9_-]{10,}$/, 'Invalid story ID')
};

// Sanitization utilities
export const sanitize = {
  // HTML sanitization
  html: (input: string, options: {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    allowedStyles?: string[];
  } = {}): string => {
    const {
      allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'blockquote'],
      allowedAttributes = {},
      allowedStyles = []
    } = options;

    // Use cheerio for server-side sanitization
    const $ = cheerio.load(input);

    // Remove disallowed tags
    $('*').each((_, element) => {
      const tagName = element.tagName.toLowerCase();

      if (!allowedTags.includes(tagName)) {
        // Convert disallowed tags to text
        $(element).replaceWith($(element).text());
      } else {
        // Remove disallowed attributes
        const allowedAttrs = allowedAttributes[tagName] || [];
        const attrs = Object.keys(element.attribs);

        attrs.forEach(attr => {
          if (!allowedAttrs.includes(attr)) {
            delete element.attribs[attr];
          }
        });

        // Filter style attributes
        if (element.attribs.style && allowedStyles.length > 0) {
          const styles = element.attribs.style.split(';');
          const filteredStyles = styles.filter(style => {
            const property = style.split(':')[0]?.trim();
            return property && allowedStyles.includes(property);
          });
          element.attribs.style = filteredStyles.join(';');
        }
      }
    });

    return $.html();
  },

  // Remove potential XSS payloads
  xss: (input: string): string => {
    return input
      .replace(new RegExp(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi), '')
      .replace(new RegExp(/javascript:/gi), '')
      .replace(new RegExp(/on\w+\s*=/gi), '')
      .replace(new RegExp(/data:text\/html/i), '')
      .replace(new RegExp(/vbscript:/gi), '')
      .replace(new RegExp(/about:/gi), '')
      .replace(new RegExp(/eval\(/gi), '')
      .trim();
  },

  // SQL injection prevention
  sql: (input: string): string => {
    return input
      .replace(new RegExp(/[';\\]/g), '')
      .replace(new RegExp(/(--)/g), '')
      .replace(new RegExp(/(\/\*|\*\/)/g), '')
      .trim();
  },

  // Path traversal prevention
  path: (input: string): string => {
    return input
      replace(new RegExp(/\.\./g), '')
      replace(new RegExp(/[\/\\]/g), '_')
      .trim();
  },

  // Command injection prevention
  command: (input: string): string => {
    return input
      replace(new RegExp(/[|&;$`\\]/g), '')
      replace(new RegExp(/\(/g), '')
      replace(new RegExp(/\)/g), '')
      .trim();
  },

  // General purpose sanitization
  general: (input: unknown): string => {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      replace(new RegExp(/[<>\"'&]/g), '')
      replace(new RegExp(/\s+/g), ' ')
      .trim();
  }
};

// Validation utilities
export const validate = {
  // Email validation with additional checks
  email: (email: string): boolean => {
    const emailRegex = new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
    if (!emailRegex.test(email)) {
      return false;
    }

    // Check for disposable email domains
    const disposableDomains = [
      'mailinator.com', '10minutemail.com', 'guerrillamail.com',
      'tempmail.org', 'throwaway.email', 'fakeinbox.com'
    ];

    const domain = email.split('@')[1].toLowerCase();
    return !disposableDomains.includes(domain);
  },

  // Strong password validation
  password: (password: string): {
    isValid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    errors: string[];
  } => {
    const errors: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (!new RegExp(/[A-Z]/).test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!new RegExp(/[a-z]/).test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!new RegExp(/[0-9]/).test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!new RegExp(/[^A-Za-z0-9]/).test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check password strength
    let score = 0;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;

    if (score >= 3) strength = 'strong';
    else if (score >= 2) strength = 'medium';

    return {
      isValid: errors.length === 0,
      strength,
      errors
    };
  },

  // Username validation
  username: (username: string): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    if (username.length < 3) {
      errors.push('Username must be at least 3 characters');
    }

    if (username.length > 30) {
      errors.push('Username must be at most 30 characters');
    }

    if (!new RegExp(/^[a-zA-Z0-9_]+$/).test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }

    // Check for common bad usernames
    const badUsernames = [
      'admin', 'administrator', 'root', 'user', 'test', 'demo',
      'support', 'help', 'info', 'contact', 'abuse', 'security'
    ];

    if (badUsernames.includes(username.toLowerCase())) {
      errors.push('This username is reserved');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Content length validation
  contentLength: (content: string, min: number = 10, max: number = 100000): boolean => {
    const length = content.trim().length;
    return length >= min && length <= max;
  },

  // File type validation
  fileType: (filename: string, allowedTypes: string[] = [
    'jpg', 'jpeg', 'png', 'gif', 'webp',
    'pdf', 'doc', 'docx', 'txt',
    'mp4', 'mov', 'avi', 'webm'
  ]): boolean => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return allowedTypes.includes(extension);
  },

  // File size validation
  fileSize: (size: number, maxSize: number = 10 * 1024 * 1024): boolean => {
    return size <= maxSize;
  }
};

// Security validators
export const security = {
  // Check for SQL injection patterns
  sqlInjection: (input: string): boolean => {
    const sqlPatterns = [
      /(union|select|insert|delete|update|drop|create|alter|exec|execute|truncate)/i,
      /('|--|\/\*|\*\/|;|\\|\/|\\\*)/,
      /(waitfor|delay|sleep)/i,
      /(xp_cmdshell|sp_oacreate)/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  },

  // Check for XSS patterns
  xss: (input: string): boolean => {
    const xssPatterns = [
      /<script[^>]*?>.*?<\/script>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe[^>]*?>.*?<\/iframe>/i,
      /<object[^>]*?>.*?<\/object>/i,
      /<embed[^>]*?>.*?<\/embed>/i,
      /<applet[^>]*?>.*?<\/applet>/i,
      /<form[^>]*?>.*?<\/form>/i,
      /<input[^>]*?>/i,
      /<button[^>]*?>/i,
      /<img[^>]*?>/i,
      /<link[^>]*?>/i,
      /<meta[^>]*?>/i,
      /<style[^>]*?>.*?<\/style>/i,
      /<textarea[^>]*?>.*?<\/textarea>/i,
      /<select[^>]*?>.*?<\/select>/i,
      /<option[^>]*?>/i,
      /<svg[^>]*?>.*?<\/svg>/i,
      /<math[^>]*?>.*?<\/math>/i,
      /<frame[^>]*?>.*?<\/frame>/i,
      /<frameset[^>]*?>.*?<\/frameset>/i,
      /<layer[^>]*?>.*?<\/layer>/i,
      /<ilayer[^>]*?>.*?<\/ilayer>/i,
      /data\s*=/i,
      /vbscript:/i,
      /about:/i
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  },

  // Check for command injection
  commandInjection: (input: string): boolean => {
    const cmdPatterns = [
      /[|&;`$\\]/,
      /\$\([^)]*\)/,
      /`[^`]*`/,
      /!\([^)]*\)/,
      /waitfor\s+delay/i,
      /sleep\s*\(\s*\d+\s*\)/i
    ];

    return cmdPatterns.some(pattern => pattern.test(input));
  },

  // Check for path traversal
  pathTraversal: (input: string): boolean => {
    const pathPatterns = [
      new RegExp(/\.\.\//),
      new RegExp(/\.\.\\/),
      'etc/',
      'var/',
      'usr/',
      'bin/',
      'tmp/',
      'windows/',
      'winnt/',
      'program files/'
    ];

    return pathPatterns.some(pattern =>
      typeof pattern === 'string' ? input.includes(pattern) : pattern.test(input)
    );
  },

  // Check for LDAP injection
  ldapInjection: (input: string): boolean => {
    const ldapPatterns = [
      new RegExp(/(\(|\)|,|;|\||\&|!|\=|\>|\<|~|\*|\+)/),
      new RegExp('(\\\\\\*\\\\)|\\\\(|\\\\)|\\\\\\\\|\\\\/|,|#|;)')
    ];

    return ldapPatterns.some(pattern => pattern.test(input));
  },

  // Check for SSRF (Server-Side Request Forgery)
  ssrf: (input: string): boolean => {
    const ssrfPatterns = [
      new RegExp(/localhost/i),
      new RegExp(/127\.0\.0\.1/),
      new RegExp(/0\.0\.0\.0/),
      new RegExp(/192\.168\./),
      new RegExp(/10\./),
      new RegExp(/172\.(1[6-9]|2[0-9]|3[01])\./),
      new RegExp(/169\.254\./),
      'file://',
      'gopher://',
      'dict://',
      'ftp://'
    ];

    return ssrfPatterns.some(pattern =>
      typeof pattern === 'string' ? input.includes(pattern) : pattern.test(input)
    );
  },

  // Check for XML External Entity (XXE)
  xxe: (input: string): boolean => {
    const xxePatterns = [
      /<!DOCTYPE/i,
      /<!ENTITY/i,
      /SYSTEM\s*["']/i,
      /PUBLIC\s*["']/i,
      /<!\[/,
      /<!\[CDATA\[/i
    ];

    return xxePatterns.some(pattern => pattern.test(input));
  }
};

// Input validator class
export class InputValidator {
  private schema: z.ZodType<any>;
  private securityChecks: Array<(input: string) => boolean> = [];

  constructor(schema: z.ZodType<any>) {
    this.schema = schema;
  }

  // Add security checks
  addSecurityCheck(check: (input: string) => boolean): InputValidator {
    this.securityChecks.push(check);
    return this;
  }

  // Add multiple security checks
  addSecurityChecks(checks: Array<(input: string) => boolean>): InputValidator {
    this.securityChecks.push(...checks);
    return this;
  }

  // Validate input
  async validate(input: unknown, fieldName: string = 'input'): Promise<any> {
    try {
      // Convert to string if it's not already
      const inputStr = typeof input !== 'string' ? String(input) : input;

      // Run security checks
      for (const check of this.securityChecks) {
        if (check(inputStr)) {
          await securityManager.logAudit({
            action: 'SECURITY_VIOLATION',
            resource: 'input_validation',
            result: 'failure',
            metadata: {
              field: fieldName,
              violation: check.name || 'unknown',
              input: inputStr.substring(0, 100) + (inputStr.length > 100 ? '...' : '')
            }
          });

          throw new SecurityError(
            `Security violation detected in ${fieldName}`,
            'high'
          );
        }
      }

      // Validate with Zod schema
      const result = this.schema.parse(input);

      // Additional validation for strings
      if (typeof input === 'string') {
        // Check for potential security issues
        if (input.length > 10000) {
          console.warn(`Input ${fieldName} is unusually long (${input.length} characters)`);
        }

        // Check for repeated characters (potential DoS)
        const repeatedChars = new RegExp(/(.)\1{10,}/);
        if (repeatedChars.test(input)) {
          console.warn(`Input ${fieldName} contains repeated character patterns`);
        }
      }

      await securityManager.logAudit({
        action: 'INPUT_VALIDATED',
        resource: 'input_validation',
        result: 'success',
        metadata: {
          field: fieldName,
          inputType: typeof input,
          inputLength: typeof input === 'string' ? input.length : 'N/A'
        }
      });

      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors[0]?.message || 'Validation failed';
        throw new ValidationError(fieldName, message, input);
      }

      throw error;
    }
  }

  // Validate and sanitize
  async validateAndSanitize(
    input: unknown,
    fieldName: string = 'input',
    sanitizer?: (input: string) => string
  ): Promise<any> {
    let sanitizedInput = input;

    if (typeof input === 'string') {
      sanitizedInput = sanitizer ? sanitizer(input) : sanitize.general(input);
    }

    return await this.validate(sanitizedInput, fieldName);
  }
}

// Factory function for common validators
export const createValidator = (schema: z.ZodType<any>): InputValidator => {
  return new InputValidator(schema);
};

// Pre-configured validators
export const validators = {
  // User input validators
  email: createValidator(userSchemas.email)
    .addSecurityChecks([security.xss, security.sqlInjection, commandInjection]),

  username: createValidator(userSchemas.username)
    .addSecurityChecks([security.xss, security.sqlInjection, security.ldapInjection]),

  password: createValidator(userSchemas.password)
    .addSecurityChecks([security.xss, security.sqlInjection]),

  displayName: createValidator(userSchemas.displayName)
    .addSecurityChecks([security.xss, security.sqlInjection]),

  // Story validators
  storyTitle: createValidator(storySchemas.title)
    .addSecurityChecks([security.xss, security.sqlInjection, commandInjection]),

  storyContent: createValidator(storySchemas.content)
    .addSecurityChecks([security.xss, security.sqlInjection, commandInjection])
    .addSecurityChecks([security.xxe]),

  // API validators
  apiKey: createValidator(apiSchemas.apiKey)
    .addSecurityChecks([security.xss, security.sqlInjection]),

  deviceId: createValidator(apiSchemas.deviceId)
    .addSecurityChecks([security.xss, security.sqlInjection, pathTraversal]),

  storyId: createValidator(apiSchemas.storyId)
    .addSecurityChecks([security.xss, security.sqlInjection])
};

// Request validation middleware
export const validateRequest = (schema: z.ZodType<any>, options?: {
  sanitize?: boolean;
  securityChecks?: Array<(input: string) => boolean>;
}) => {
  return async (request: any, response: any, next: any) => {
    try {
      const data = request.body || request.params || request.query;

      const validator = createValidator(schema);
      if (options?.securityChecks) {
        validator.addSecurityChecks(options.securityChecks);
      }

      const validatedData = await validator.validate(data);

      // Replace request data with validated data
      if (request.body) request.body = validatedData;
      if (request.params) request.params = validatedData;
      if (request.query) request.query = validatedData;

      next();
    } catch (error) {
      if (error instanceof ValidationError || error instanceof SecurityError) {
        await securityManager.logAudit({
          action: 'REQUEST_VALIDATION_FAILED',
          resource: 'api_security',
          result: 'failure',
          metadata: {
            error: error.message,
            field: error instanceof ValidationError ? error.field : 'unknown'
          }
        });
      }

      response.status(400).json({
        error: error.message,
        code: error.name
      });
    }
  };
};

// Batch validation utility
export const validateBatch = async (items: Array<{
  input: unknown;
  schema: z.ZodType<any>;
  fieldName: string;
}>): Promise<Array<{
  index: number;
  data?: any;
  error?: ValidationError | SecurityError;
}>> => {
  const results: Array<{
    index: number;
    data?: any;
    error?: ValidationError | SecurityError;
  }> = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const validator = createValidator(items[i].schema);
      const data = await validator.validate(items[i].input, items[i].fieldName);
      results.push({ index: i, data });
    } catch (error) {
      results.push({
        index: i,
        error: error as ValidationError | SecurityError
      });
    }
  }

  return results;
};