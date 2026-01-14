import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { Platform } from 'react-native';

export interface BiometricConfig {
  enabled: boolean;
  fallbackToPin: boolean;
  maxAttempts: number;
  biometricType: 'fingerprint' | 'face' | 'iris' | undefined;
  requireConfirmation: boolean;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  biometricType?: string;
  requiresFallback?: boolean;
}

const DEFAULT_CONFIG: BiometricConfig = {
  enabled: true,
  fallbackToPin: true,
  maxAttempts: 3,
  biometricType: undefined,
  requireConfirmation: true,
};

export class BiometricAuthService {
  private static instance: BiometricAuthService;
  private config: BiometricConfig;
  private authAttempts = 0;
  private lastAuthAttempt = 0;
  private lockoutUntil = 0;

  private constructor() {
    this.config = DEFAULT_CONFIG;
    this.initialize();
  }

  static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  private async initialize() {
    try {
      // Check biometric availability
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      // Determine the primary biometric type
      // Note: FACIAL_RECOGNITION is the correct constant, not FACE
      if (supportedTypes.length > 0) {
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          this.config.biometricType = 'fingerprint';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          this.config.biometricType = 'face';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          this.config.biometricType = 'iris';
        }
      }

      // Load user preferences
      const userPref = await SecureStore.getItemAsync('biometric_preference');
      if (userPref) {
        this.config = { ...this.config, ...JSON.parse(userPref) };
      }

      // Check if biometric is available and enabled
      if (hasHardware && this.config.enabled) {
        // Test if biometrics are enrolled
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) {
          this.config.enabled = false;
        }
      }

      console.log('[BiometricAuth] Initialized', {
        hasHardware,
        supportedTypes,
        biometricType: this.config.biometricType,
        enabled: this.config.enabled,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[BiometricAuth] Initialization error:', errorMessage);
      this.config.enabled = false;
    }
  }

  // Main authentication method
  async authenticate(reason: string = 'Authenticate to access Parallel Story Builder'): Promise<AuthResult> {
    if (!this.config.enabled) {
      return {
        success: false,
        error: 'Biometric authentication is not enabled or available',
      };
    }

    // Check rate limiting
    if (this.authAttempts >= this.config.maxAttempts) {
      const now = Date.now();
      if (now < this.lockoutUntil) {
        const remaining = Math.ceil((this.lockoutUntil - now) / 1000);
        return {
          success: false,
          error: `Too many attempts. Try again in ${remaining} seconds`,
          requiresFallback: this.config.fallbackToPin,
        };
      }
      // Reset attempts after lockout
      this.authAttempts = 0;
    }

    try {
      // Use LocalAuthenticationOptions, not AuthenticationOptions
      const authenticateOptions: LocalAuthentication.LocalAuthenticationOptions = {
        promptMessage: reason,
        disableDeviceFallback: !this.config.fallbackToPin,
        cancelLabel: 'Cancel',
        fallbackLabel: this.config.fallbackToPin ? 'Use PIN' : undefined,
      };

      const result = await LocalAuthentication.authenticateAsync(authenticateOptions);

      if (result.success) {
        this.authAttempts = 0;
        console.log('[BiometricAuth] Authentication successful');

        return {
          success: true,
          biometricType: this.config.biometricType,
        };
      } else {
        this.handleFailedAuth();
        return {
          success: false,
          error: result.error || 'Authentication failed',
          requiresFallback: this.config.fallbackToPin && !result.error?.includes('fallback'),
        };
      }
    } catch (error: unknown) {
      this.handleFailedAuth();
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[BiometricAuth] Authentication error:', errorMessage);

      return {
        success: false,
        error: errorMessage,
        requiresFallback: this.config.fallbackToPin,
      };
    }
  }

  private handleFailedAuth() {
    this.authAttempts++;
    this.lastAuthAttempt = Date.now();

    if (this.authAttempts >= this.config.maxAttempts) {
      this.lockoutUntil = Date.now() + 5 * 60 * 1000; // 5 minutes lockout
    }
  }

  // Enable biometric authentication
  async enableBiometric(): Promise<boolean> {
    try {
      if (!(await LocalAuthentication.hasHardwareAsync())) {
        Alert.alert('Biometric Not Available', 'Your device does not support biometric authentication.');
        return false;
      }

      if (!(await LocalAuthentication.isEnrolledAsync())) {
        Alert.alert(
          'Biometric Not Enrolled',
          'Please set up biometric authentication in your device settings first.',
          [{ text: 'OK', style: 'default' }]
        );
        return false;
      }

      this.config.enabled = true;
      await this.saveConfig();

      console.log('[BiometricAuth] Biometric enabled');
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[BiometricAuth] Enable error:', errorMessage);
      return false;
    }
  }

  // Disable biometric authentication
  async disableBiometric(): Promise<boolean> {
    try {
      this.config.enabled = false;
      await this.saveConfig();

      console.log('[BiometricAuth] Biometric disabled');
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[BiometricAuth] Disable error:', errorMessage);
      return false;
    }
  }

  // Configuration methods
  async updateConfig(newConfig: Partial<BiometricConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();
  }

  private async saveConfig(): Promise<void> {
    await SecureStore.setItemAsync('biometric_preference', JSON.stringify(this.config));
  }

  getConfig(): BiometricConfig {
    return { ...this.config };
  }

  // Check if biometric is available (without attempting auth)
  async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch {
      return false;
    }
  }

  // Get biometric type
  getBiometricType(): string | undefined {
    return this.config.biometricType;
  }

  // Get remaining attempts
  getRemainingAttempts(): number {
    if (this.authAttempts >= this.config.maxAttempts) {
      return 0;
    }
    return this.config.maxAttempts - this.authAttempts;
  }

  // Check if currently locked out
  isLockedOut(): boolean {
    return this.authAttempts >= this.config.maxAttempts && Date.now() < this.lockoutUntil;
  }

  // Get lockout remaining time
  getLockoutTimeRemaining(): number {
    if (!this.isLockedOut()) {
      return 0;
    }
    return Math.max(0, this.lockoutUntil - Date.now());
  }

  // For development/testing - bypass biometric
  async bypassForDevelopment(): Promise<AuthResult> {
    if (__DEV__) {
      console.log('[BiometricAuth] Development bypass used');
      return {
        success: true,
        biometricType: 'development',
      };
    }
    return { success: false, error: 'Bypass not allowed in production' };
  }
}

// Export singleton instance
export const biometricAuthService = BiometricAuthService.getInstance();

// Helper functions
export const promptForBiometricAuth = async (
  reason?: string,
  options?: {
    fallbackToPin?: boolean;
    maxAttempts?: number;
  }
): Promise<AuthResult> => {
  const service = BiometricAuthService.getInstance();

  if (options) {
    await service.updateConfig({
      fallbackToPin: options.fallbackToPin ?? service.getConfig().fallbackToPin,
      maxAttempts: options.maxAttempts ?? service.getConfig().maxAttempts,
    });
  }

  return await service.authenticate(reason);
};

export const isBiometricSupported = async (): Promise<boolean> => {
  return await biometricAuthService.isAvailable();
};

export const getBiometricType = (): string | undefined => {
  return biometricAuthService.getBiometricType();
};
