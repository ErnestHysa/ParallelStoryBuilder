// Core utilities
export { supabase } from './supabase';
export * from './types';
export * from './tokenManager';
export * from './aiClient';
export * from './errorHandling';
export * from './storyExport';
export * from './sentry';
export * from './offlineStorage';

// Real-time and networking
export * from './realtime';
export * from './networkListener';

// Performance optimization
export * from './cacheManager';
export * from './queryCache';
export * from './imageOptimizer';
export * from './rateLimiter';

// Security
export * from './security';
export * from './crypto';
export * from './biometricAuth';
export * from './certificatePinning';
export * from './inputValidation';

// Internationalization
export * from './i18n';

// Accessibility
export * from './accessibility';
export * from './screenReader';

// Media
export * from './mediaStorage';
export * from './richTextSerializer';

// Initialize security services
export const initializeSecurity = async () => {
  try {
    await securityManager.getInstance();
    await cryptoService.getInstance();
    await biometricAuthService.getInstance();
    await certificatePinningService.getInstance();
    await rateLimiter.getInstance();
    console.log('Security system initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize security system:', error);
    return false;
  }
};

// Get security status
export const getSecurityStatus = () => {
  return {
    biometric: biometricAuthService.getConfig().enabled,
    encryption: true,
    certificatePinning: certificatePinningService.getConfig().enabled,
    rateLimiting: rateLimiter.getConfig().enabled,
    auditLogging: securityManager.getConfig().auditLogLevel,
    sessionTimeout: securityManager.getConfig().sessionTimeout / 60000,
    securityScore: calculateSecurityScore()
  };
};

// Convenience exports
export const { sanitizeInput, validateAgainstXSS, generateSecureToken } = security;
export const { encryptData, decryptData } = securityManager;
export const { encrypt: encryptCrypto, decrypt: decryptCrypto } = cryptoService;
export const { authenticate: authenticateBiometric, isAvailable: isBiometricAvailable } = biometricAuthService;

// Helper functions
const calculateSecurityScore = () => {
  let score = 0;
  if (biometricAuthService.getConfig().enabled) score += 20;
  score += 20; // Encryption
  if (certificatePinningService.getConfig().enabled) score += 15;
  if (rateLimiter.getConfig().enabled) score += 15;
  const sessionTimeout = securityManager.getConfig().sessionTimeout / 60000;
  if (sessionTimeout <= 30) score += 15;
  const auditLevel = securityManager.getConfig().auditLogLevel;
  if (auditLevel === 'verbose') score += 15;
  else if (auditLevel === 'standard') score += 10;
  return score;
};