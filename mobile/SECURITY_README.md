# Security Hardening System for Parallel Story Builder

This document describes the comprehensive security hardening system implemented for Parallel Story Builder.

## Overview

The security system implements multiple layers of protection to ensure the confidentiality, integrity, and availability of user data. It addresses OWASP Top 10 security concerns including broken access control, cryptographic failures, injection attacks, and authentication failures.

## Architecture

### Core Security Modules

1. **Security Manager** (`lib/security.ts`)
   - Central security orchestrator
   - Audit logging system
   - Session management
   - Rate limiting coordination
   - Security configuration management

2. **Crypto Service** (`lib/crypto.ts`)
   - Encryption/decryption utilities
   - Key derivation and management
   - Secure storage helpers
   - Digital signature capabilities
   - Password hashing

3. **Biometric Authentication** (`lib/biometricAuth.ts`)
   - Face ID/Touch ID integration
   - Secure token storage
   - Authentication state management
   - Fallback mechanisms

4. **Certificate Pinning** (`lib/certificatePinning.ts`)
   - SSL certificate validation
   - Man-in-the-middle protection
   - Network security headers
   - Certificate violation reporting

5. **Rate Limiter** (`lib/rateLimiter.ts`)
   - API endpoint rate limiting
   - Configurable per-endpoint limits
   - Client-side enforcement
   - Persistent storage integration

6. **Input Validation** (`lib/inputValidation.ts`)
   - Comprehensive input sanitization
   - Zod schema validation
   - XSS/SQL injection prevention
   - Security validators

### Components

1. **Biometric Lock** (`components/BiometricLock.tsx`)
   - Biometric authentication UI
   - Lock screen component
   - Auto-lock functionality
   - Error handling and fallbacks

2. **Security Settings** (`app/(app)/settings/security.tsx`)
   - Security configuration UI
   - Security score display
   - Data management tools
   - Test and monitoring features

## Key Features

### 1. Certificate Pinning for Supabase
```typescript
// Configure certificate pinning for Supabase endpoints
await certificatePinningService.updateHostPins('your-project.supabase.co', [
  'pin-sha256="base64-encoded-pin1"',
  'pin-sha256="base64-encoded-pin2"'
]);
```

### 2. Biometric Authentication
```typescript
// Enable biometric authentication
await biometricAuthService.enableBiometric();

// Authenticate user
const result = await biometricAuthService.authenticate();
if (result.success) {
  // User authenticated successfully
}
```

### 3. Data Encryption
```typescript
// Encrypt sensitive data
const encrypted = await securityManager.encryptData({
  apiKey: 'secret-api-key',
  refreshToken: 'refresh-token'
});

// Store encrypted data
await securityManager.encryptAndStore('secure_credentials', encrypted);

// Retrieve and decrypt
const decrypted = await securityManager.decryptAndRetrieve('secure_credentials');
```

### 4. Input Sanitization
```typescript
// Sanitize user input to prevent XSS
const safeInput = sanitizeInput(userInput);

// Validate against schemas
const validator = createValidator(userSchemas.email);
const validatedEmail = await validator.validate(email);
```

### 5. Rate Limiting
```typescript
// Configure rate limiting for API endpoints
await rateLimiter.updateConfig({
  endpoints: {
    '/api/auth/login': {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5
    }
  }
});

// Check rate limit before API call
const result = await rateLimiter.checkLimit({
  endpoint: '/api/auth/login',
  method: 'POST',
  userId: currentUserId
});
```

## Security Configuration

### Default Security Levels

1. **Biometric Authentication**: Enabled by default
2. **Data Encryption**: Always enabled
3. **Certificate Pinning**: Enabled for all API endpoints
4. **Rate Limiting**: Enabled with sensible defaults
5. **Session Timeout**: 30 minutes
6. **Audit Logging**: Standard level

### Customization

All security services can be configured through their respective `updateConfig` methods:

```typescript
// Update security manager config
await securityManager.updateConfig({
  sessionTimeout: 15 * 60 * 1000, // 15 minutes
  auditLogLevel: 'verbose'
});

// Update biometric settings
await biometricAuthService.updateConfig({
  fallbackToPin: true,
  maxAttempts: 3
});
```

## OWASP Top 10 Coverage

### A01: Broken Access Control
- Enhanced session management with automatic timeout
- Biometric authentication for sensitive operations
- Rate limiting to prevent brute force attacks
- Secure storage of access tokens

### A02: Cryptographic Failures
- AES-256-GCM encryption for data at rest
- PBKDF2 key derivation with 10,000 iterations
- Secure random number generation
- Certificate pinning for TLS connections

### A03: Injection
- Comprehensive input sanitization
- XSS prevention with HTML filtering
- SQL injection protection
- Command injection prevention

### A07: Authentication Failures
- Biometric authentication (Face ID/Touch ID)
- Secure session management
- Account lockout after multiple failed attempts
- Fallback authentication methods

## Integration Guide

### 1. Initialize Security Services

```typescript
import { initializeSecurity } from './lib';

// Initialize all security services on app start
const securityInitialized = await initializeSecurity();
if (!securityInitialized) {
  // Handle initialization failure
}
```

### 2. Protect API Calls

```typescript
import { checkRateLimit, recordSecurityEvent } from './lib';

// Before API call
const rateLimitResult = await checkRateLimit({
  endpoint: '/api/story/create',
  method: 'POST',
  userId: user.id
});

if (!rateLimitResult.allowed) {
  throw new Error('Rate limit exceeded');
}

// After successful API call
await recordSecurityEvent('STORY_CREATED', 'api_endpoint', {
  storyId: newStory.id,
  wordCount: newStory.wordCount
});
```

### 3. Protect Sensitive Screens

```typescript
import { withBiometricLock } from './components/BiometricLock';

// Wrap sensitive screens with biometric protection
const ProtectedScreen = withBiometricLock(SensitiveScreen, {
  enabled: true,
  fallbackToPin: true
});
```

### 4. Validate User Input

```typescript
import { validators, sanitizeInput } from './lib';

// In form submission
const sanitizedTitle = sanitizeInput(formData.title);
const validatedTitle = await validators.storyTitle.validate(sanitizedTitle);
```

## Security Auditing

### Audit Logs

The system maintains detailed audit logs of all security events:

```typescript
// Get recent audit logs
const logs = securityManager.getAuditLogs();

// Logs include:
// - Authentication attempts
// - Data encryption/decryption
// - Rate limit violations
// - Security configuration changes
// - API access patterns
```

### Security Reporting

Generate security reports for monitoring:

```typescript
// Get security status
const status = getSecurityStatus();
console.log(`Security Score: ${status.securityScore}%`);

// Export audit logs
const exportData = JSON.stringify(auditLogs, null, 2);
```

## Best Practices

### 1. Security Initialization
- Initialize security services as early as possible in the app lifecycle
- Handle initialization failures gracefully
- Provide fallback mechanisms when security features are unavailable

### 2. Data Protection
- Always encrypt sensitive data before storage
- Use appropriate encryption keys for different data types
- Implement key rotation policies

### 3. Network Security
- Enable certificate pinning for all API endpoints
- Use secure HTTPS connections exclusively
- Implement proper error handling for network failures

### 4. User Authentication
- Require biometric authentication for sensitive operations
- Implement session timeout with auto-lock
- Provide clear feedback on authentication failures

### 5. Input Handling
- Validate and sanitize all user input
- Use schema validation for structured data
- Implement rate limiting to prevent abuse

## Troubleshooting

### Common Issues

1. **Biometric Authentication Not Available**
   - Check if device supports biometric authentication
   - Verify biometrics are enrolled in device settings
   - Provide PIN fallback option

2. **Certificate Pinning Violations**
   - Update pinned certificates when renewing SSL certificates
   - Configure report-only mode during certificate updates
   - Monitor violation reports

3. **Performance Impact**
   - Adjust rate limiting thresholds as needed
   - Optimize audit log retention periods
   - Consider using memory storage for temporary data

### Debug Mode

```typescript
// Enable verbose logging
await securityManager.updateConfig({
  auditLogLevel: 'verbose'
});

// Check security status
const status = getSecurityStatus();
console.log('Status:', status);
```

## Security Considerations

1. **Physical Security**: Ensure device passcode/fingerprint is enabled
2. **Network Security**: Use VPN for public networks when possible
3. **Data Privacy**: Be cautious about storing sensitive user data
4. **Compliance**: Ensure compliance with relevant data protection regulations
5. **Updates**: Keep security modules updated with latest patches

## Support

For security-related questions or concerns:
- Email: security@parallelstorybuilder.com
- Documentation: See individual module JSDoc comments
- Security incidents: Report through the app's security settings