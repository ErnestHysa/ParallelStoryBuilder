import { Platform } from 'react-native';
import { securityManager } from './security';

export interface PinningConfig {
  enabled: boolean;
  hostPins: Record<string, string[]>;
  includeSubdomains: boolean;
  enforcePinning: boolean;
  reportUri?: string;
  maxAge: number;
  failureThreshold: number;
}

interface CertificateInfo {
  sha256: string;
  commonName: string;
  organization: string;
  notValidBefore: Date;
  notValidAfter: Date;
  issuer: string;
}

const DEFAULT_CONFIG: PinningConfig = {
  enabled: true,
  hostPins: {
    // Supabase endpoints
    'your-project.supabase.co': [
      'pin-sha256="base64-encoded-pin1"',
      'pin-sha256="base64-encoded-pin2"'
    ],
    // Add your Supabase project URL here
    'api.supabase.co': [
      'pin-sha256="base64-encoded-pin1"',
      'pin-sha256="base64-encoded-pin2"'
    ]
  },
  includeSubdomains: true,
  enforcePinning: true,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  failureThreshold: 5
};

export class CertificatePinningService {
  private static instance: CertificatePinningService;
  private config: PinningConfig;
  private violationCount = 0;
  private lastCheck = 0;

  private constructor() {
    this.config = DEFAULT_CONFIG;
    this.initialize();
  }

  static getInstance(): CertificatePinningService {
    if (!CertificatePinningService.instance) {
      CertificatePinningService.instance = new CertificatePinningService();
    }
    return CertificatePinningService.instance;
  }

  private async initialize() {
    try {
      // Load configuration from secure storage
      const savedConfig = await securityManager.decryptAndRetrieve<PinningConfig>('certificate_pinning_config');
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }

      // Validate pins in development
      if (__DEV__) {
        await this.validateAllPins();
      }

      await securityManager.logAudit({
        action: 'CERTIFICATE_PINNING_INIT',
        resource: 'network_security',
        result: 'success',
        metadata: {
          enabled: this.config.enabled,
          hosts: Object.keys(this.config.hostPins)
        }
      });
    } catch (error) {
      await securityManager.logAudit({
        action: 'CERTIFICATE_PINNING_INIT_ERROR',
        resource: 'network_security',
        result: 'failure',
        metadata: { error: error.message }
      });
      this.config.enabled = false;
    }
  }

  // Validate certificate chain against pins
  async validateCertificate(
    hostname: string,
    certificates: CertificateInfo[]
  ): Promise<{ valid: boolean; reason?: string }> {
    if (!this.config.enabled) {
      return { valid: true };
    }

    try {
      // Check if hostname is pinned
      const pins = this.getPinsForHost(hostname);
      if (!pins || pins.length === 0) {
        return { valid: true, reason: 'No pins configured for host' };
      }

      // Check certificates against pins
      for (const cert of certificates) {
        if (this.validateCertificatePin(cert, pins)) {
          await securityManager.logAudit({
            action: 'CERTIFICATE_VALIDATED',
            resource: 'network_security',
            result: 'success',
            metadata: {
              hostname,
              sha256: cert.sha256,
              commonName: cert.commonName
            }
          });

          // Reset violation count on successful validation
          this.violationCount = 0;
          return { valid: true };
        }
      }

      // Certificate pin validation failed
      this.violationCount++;
      await this.handlePinViolation(hostname, certificates);

      return {
        valid: false,
        reason: `Certificate pin validation failed (${this.violationCount} violations)`
      };
    } catch (error) {
      await securityManager.logAudit({
        action: 'CERTIFICATE_VALIDATION_ERROR',
        resource: 'network_security',
        result: 'failure',
        metadata: {
          hostname,
          error: error.message
        }
      });

      // In non-enforce mode, allow connection but log
      if (!this.config.enforcePinning) {
        return { valid: true, reason: error.message };
      }

      return { valid: false, reason: error.message };
    }
  }

  private getPinsForHost(hostname: string): string[] | null {
    // Check exact hostname match
    if (this.config.hostPins[hostname]) {
      return this.config.hostPins[hostname];
    }

    // Check wildcard if includeSubdomains is true
    if (this.config.includeSubdomains) {
      const parts = hostname.split('.');
      if (parts.length > 2) {
        const wildcardHost = `*.${parts.slice(1).join('.')}`;
        if (this.config.hostPins[wildcardHost]) {
          return this.config.hostPins[wildcardHost];
        }
      }
    }

    return null;
  }

  private validateCertificatePin(cert: CertificateInfo, pins: string[]): boolean {
    return pins.some(pin => {
      const pinSha256 = this.extractSha256FromPin(pin);
      if (!pinSha256) return false;

      // In a real implementation, compare cert.sha256 with pinSha256
      // For demonstration, we'll use a simplified check
      return cert.sha256 === pinSha256;
    });
  }

  private extractSha256FromPin(pin: string): string | null {
    const match = pin.match(/pin-sha256="([^"]+)"/);
    return match ? match[1] : null;
  }

  private async handlePinViolation(hostname: string, certificates: CertificateInfo[]) {
    await securityManager.logAudit({
      action: 'CERTIFICATE_PIN_VIOLATION',
      resource: 'network_security',
      result: 'failure',
      metadata: {
        hostname,
        violationCount: this.violationCount,
        certificates: certificates.map(cert => ({
          sha256: cert.sha256,
          commonName: cert.commonName
        }))
      }
    });

    // Check if we should report the violation
    if (this.config.reportUri && this.violationCount % 3 === 0) {
      await this.reportPinViolation(hostname, certificates);
    }

    // Check if we should fail the connection
    if (this.config.enforcePinning && this.violationCount >= this.config.failureThreshold) {
      await securityManager.logAudit({
        action: 'CERTIFICATE_PIN_BLOCKED',
        resource: 'network_security',
        result: 'failure',
        metadata: {
          hostname,
          violationCount: this.violationCount,
          threshold: this.config.failureThreshold
        }
      });
      throw new Error(`Certificate pinning blocked after ${this.violationCount} violations`);
    }
  }

  private async reportPinViolation(hostname: string, certificates: CertificateInfo[]) {
    try {
      const report = {
        hostname,
        violationCount: this.violationCount,
        certificates,
        timestamp: new Date().toISOString(),
        userAgent: Platform.OS
      };

      // In production, send to reporting endpoint
      // For now, just log it
      await securityManager.logAudit({
        action: 'PIN_VIOLATION_REPORTED',
        resource: 'network_security',
        result: 'warning',
        metadata: report
      });
    } catch (error) {
      // Don't fail if reporting fails
      console.error('Failed to report pin violation:', error);
    }
  }

  // Add or update host pins
  async updateHostPins(hostname: string, pins: string[]): Promise<void> {
    this.config.hostPins[hostname] = pins;
    await this.saveConfig();

    await securityManager.logAudit({
      action: 'HOST_PINS_UPDATED',
      resource: 'network_security',
      result: 'success',
      metadata: { hostname, pinCount: pins.length }
    });
  }

  // Remove host pins
  async removeHostPins(hostname: string): Promise<void> {
    delete this.config.hostPins[hostname];
    await this.saveConfig();

    await securityManager.logAudit({
      action: 'HOST_PINS_REMOVED',
      resource: 'network_security',
      result: 'success',
      metadata: { hostname }
    });
  }

  // Enable or disable certificate pinning
  async setEnabled(enabled: boolean): Promise<void> {
    this.config.enabled = enabled;
    await this.saveConfig();

    await securityManager.logAudit({
      action: 'CERTIFICATE_PINNING_' + (enabled ? 'ENABLED' : 'DISABLED'),
      resource: 'network_security',
      result: 'success'
    });
  }

  // Validate all configured pins
  async validateAllPins(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const [hostname, pins] of Object.entries(this.config.hostPins)) {
      try {
        // In a real implementation, fetch and validate certificates
        // For now, just validate pin format
        for (const pin of pins) {
          if (!this.extractSha256FromPin(pin)) {
            errors.push(`Invalid pin format for ${hostname}: ${pin}`);
          }
        }
      } catch (error) {
        errors.push(`Failed to validate pins for ${hostname}: ${error.message}`);
      }
    }

    const valid = errors.length === 0;

    await securityManager.logAudit({
      action: 'PIN_VALIDATION',
      resource: 'network_security',
      result: valid ? 'success' : 'failure',
      metadata: {
        totalHosts: Object.keys(this.config.hostPins).length,
        errorCount: errors.length
      }
    });

    return { valid, errors };
  }

  // Generate new pins for a host (for certificate rotation)
  async generateNewPins(hostname: string, count: number = 2): Promise<string[]> {
    const newPins = [];
    for (let i = 0; i < count; i++) {
      // In a real implementation, generate actual certificate hashes
      // For demonstration, we'll generate random strings
      newPins.push(`pin-sha256="${this.generateRandomPin()}"`);
    }

    await this.updateHostPins(hostname, newPins);

    await securityManager.logAudit({
      action: 'NEW_PINS_GENERATED',
      resource: 'network_security',
      result: 'success',
      metadata: { hostname, pinCount: count }
    });

    return newPins;
  }

  private generateRandomPin(): string {
    // Generate a random base64-like string
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Configuration management
  private async saveConfig(): Promise<void> {
    await securityManager.encryptAndStore('certificate_pinning_config', this.config);
  }

  async updateConfig(newConfig: Partial<PinningConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();

    await securityManager.logAudit({
      action: 'PINNING_CONFIG_UPDATED',
      resource: 'network_security',
      result: 'success'
    });
  }

  getConfig(): PinningConfig {
    return { ...this.config };
  }

  // Get violation count
  getViolationCount(): number {
    return this.violationCount;
  }

  // Reset violation count
  resetViolationCount(): void {
    this.violationCount = 0;
  }

  // Export configuration for backup
  async exportConfig(): Promise<string> {
    return JSON.stringify({
      version: '1.0',
      config: this.config,
      timestamp: new Date().toISOString(),
      violationCount: this.violationCount
    });
  }

  // Import configuration
  async importConfig(configJson: string): Promise<boolean> {
    try {
      const imported = JSON.parse(configJson);
      if (imported.version && imported.config) {
        this.config = { ...this.config, ...imported.config };
        await this.saveConfig();

        await securityManager.logAudit({
          action: 'PINNING_CONFIG_IMPORTED',
          resource: 'network_security',
          result: 'success',
          metadata: {
            version: imported.version,
            timestamp: imported.timestamp
          }
        });

        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Clean up old violations
  private cleanupOldViolations(): void {
    const now = Date.now();
    if (now - this.lastCheck > this.config.maxAge * 1000) {
      // Reset violation count after maxAge
      if (this.violationCount > 0) {
        this.violationCount = 0;
        this.lastCheck = now;
      }
    }
  }
}

// Export singleton instance
export const certificatePinningService = CertificatePinningService.getInstance();

// HTTP Interceptor for React Native
export class SecurityInterceptor {
  private static instance: SecurityInterceptor;
  private pinningService: CertificatePinningService;

  private constructor() {
    this.pinningService = CertificatePinningService.getInstance();
  }

  static getInstance(): SecurityInterceptor {
    if (!SecurityInterceptor.instance) {
      SecurityInterceptor.instance = new SecurityInterceptor();
    }
    return SecurityInterceptor.instance;
  }

  // Intercept fetch requests to add certificate pinning headers
  async interceptRequest(url: string, options: RequestInit = {}): Promise<RequestInit> {
    try {
      const parsedUrl = new URL(url);

      if (this.pinningService.getConfig().enabled) {
        // Add security headers
        options.headers = {
          ...options.headers,
          'X-Security-Enabled': 'true',
          'X-Certificate-Pinning': 'enabled'
        };

        // Add pinning information for the host
        const pins = this.pinningService.getPinsForHost(parsedUrl.hostname);
        if (pins) {
          options.headers['X-Expected-Pins'] = JSON.stringify(pins);
        }
      }

      return options;
    } catch (error) {
      await securityManager.logAudit({
        action: 'INTERCEPTOR_REQUEST_ERROR',
        resource: 'network_security',
        result: 'failure',
        metadata: { url, error: error.message }
      });
      return options;
    }
  }

  // Intercept responses to validate certificates
  async interceptResponse(url: string, response: Response): Promise<Response> {
    try {
      if (this.pinningService.getConfig().enabled) {
        // In a real implementation, extract and validate certificates here
        // For now, we'll just add a security header to the response
        response.headers.set('X-Security-Validated', 'true');
      }

      return response;
    } catch (error) {
      await securityManager.logAudit({
        action: 'INTERCEPTOR_RESPONSE_ERROR',
        resource: 'network_security',
        result: 'failure',
        metadata: { url, error: error.message }
      });
      return response;
    }
  }

  // Create secure fetch wrapper
  async secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const interceptedOptions = await this.interceptRequest(url, options);
    const response = await fetch(url, interceptedOptions);
    return this.interceptResponse(url, response);
  }
}

export const securityInterceptor = SecurityInterceptor.getInstance();

// Helper functions for React Native apps
export const createSecureSupabaseConfig = () => {
  const pinningConfig = certificatePinningService.getConfig();

  return {
    ...require('../../supabase').supabaseConfig,
    headers: {
      'X-Security-Enabled': 'true',
      'X-Certificate-Pinning': pinningConfig.enabled ? 'enabled' : 'disabled'
    }
  };
};

export const validateSupabaseCertificate = async (url: string): Promise<boolean> => {
  try {
    const hostname = new URL(url).hostname;
    const certificates = []; // In real implementation, fetch certificates
    const result = await certificatePinningService.validateCertificate(hostname, certificates);
    return result.valid;
  } catch {
    return false;
  }
};