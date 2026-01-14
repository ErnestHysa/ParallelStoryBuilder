// Export all constants from individual modules
export * from './colors';
export * from './spacing';
export * from './fonts';

// App Constants
export const APP = {
  NAME: 'Parallel Story Builder',
  VERSION: '1.0.0',
  BUILD_NUMBER: 1,
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  DEBUG: process.env.NODE_ENV !== 'production',
};

// Navigation Constants
export const NAVIGATION = {
  ROUTES: {
    AUTH: {
      LOGIN: 'Login',
      REGISTER: 'Register',
      FORGOT_PASSWORD: 'ForgotPassword',
    },
    APP: {
      HOME: 'Home',
      CREATE_STORY: 'CreateStory',
      JOIN_STORY: 'JoinStory',
      STORY: 'Story',
      WRITE: 'Write',
      INSPIRATIONS: 'Inspirations',
      PROFILE: 'Profile',
      SETTINGS: 'Settings',
    },
  },
  PARAMS: {
    STORY_ID: 'storyId',
    INSPIRATION_ID: 'inspirationId',
  },
};

// API Constants
export const API = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  TIMEOUT: 30000, // 30 seconds
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000, // 1 second
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
    },
    STORIES: {
      LIST: '/stories',
      CREATE: '/stories',
      UPDATE: '/stories/:id',
      DELETE: '/stories/:id',
      JOIN: '/stories/:id/join',
      LEAVE: '/stories/:id/leave',
      SHARE: '/stories/:id/share',
    },
    USERS: {
      PROFILE: '/users/profile',
      UPDATE: '/users/profile',
      AVATAR: '/users/avatar',
      NOTIFICATIONS: '/users/notifications',
    },
    AI: {
      GENERATE: '/ai/generate',
      ANALYZE: '/ai/analyze',
      SUGGEST: '/ai/suggest',
      TRANSLATE: '/ai/translate',
    },
    MEDIA: {
      UPLOAD: '/media/upload',
      DOWNLOAD: '/media/download',
      DELETE: '/media/:id',
    },
  },
};

// Supabase Constants
export const SUPABASE = {
  URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  SERVICE_ROLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '',
  STORAGE_BUCKET: 'story-media',
};

// Storage Constants
export const STORAGE = {
  KEYS: {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    APP_SETTINGS: 'app_settings',
    OFFLINE_STORIES: 'offline_stories',
    THEME: 'theme',
    LANGUAGE: 'language',
  },
  CONFIG: {
    ENCRYPTION_KEY: 'story_builder_encryption_key',
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    CACHE_SIZE: 100 * 1024 * 1024, // 100MB
  },
};

// AI Service Constants
export const AI = {
  PROVIDERS: {
    OPENAI: 'openai',
    ANTHROPIC: 'anthropic',
    LOCAL: 'local',
  },
  MODELS: {
    GPT_4: 'gpt-4',
    GPT_4_TURBO: 'gpt-4-turbo',
    GPT_3_5: 'gpt-3.5-turbo',
    CLAUDE: 'claude-3',
    CLAUDE_OPUS: 'claude-3-opus',
    LOCAL: 'local-model',
  },
  PROMPTS: {
    STORY_GENERATION: 'story_generation',
    CHARACTER_CREATION: 'character_creation',
    WORLD_BUILDING: 'world_building',
    PLOT_DEVELOPMENT: 'plot_development',
    DIALOGUE_ENHANCEMENT: 'dialogue_enhancement',
  },
  LIMITS: {
    MAX_TOKENS: 4000,
    TEMPERATURE: 0.7,
    TOP_P: 0.9,
    FREQUENCY_PENALTY: 0.1,
    PRESENCE_PENALTY: 0.1,
  },
};

// Gamification Constants
export const GAMIFICATION = {
  LEVELS: {
    BEGINNER: { min: 0, max: 99, name: 'Beginner' },
    AMATEUR: { min: 100, max: 299, name: 'Amateur' },
    INTERMEDIATE: { min: 300, max: 599, name: 'Intermediate' },
    ADVANCED: { min: 600, max: 999, name: 'Advanced' },
    EXPERT: { min: 1000, max: 1999, name: 'Expert' },
    MASTER: { min: 2000, max: 999999, name: 'Master' },
  },
  ACHIEVEMENTS: {
    FIRST_STORY: 'first_story',
    STREAK_7: 'streak_7',
    STREAK_30: 'streak_30',
    WORD_MASTER: 'word_master',
    SOCIAL_BUTTERFLY: 'social_butterfly',
    CREATIVE_GENIUS: 'creative_genius',
    PERFECTIONIST: 'perfectionist',
  },
  BADGES: {
    BRONZE: 'bronze',
    SILVER: 'silver',
    GOLD: 'gold',
    PLATINUM: 'platinum',
    DIAMOND: 'diamond',
  },
};

// Performance Constants
export const PERFORMANCE = {
  CACHE: {
    TTL: {
      STORIES: 5 * 60 * 1000, // 5 minutes
      USERS: 10 * 60 * 1000, // 10 minutes
      MEDIA: 30 * 60 * 1000, // 30 minutes
    },
    STRATEGY: {
      MEMORY: 'memory',
      PERSISTENCE: 'persistence',
      HYBRID: 'hybrid',
    },
  },
  IMAGE: {
    QUALITY: 0.8,
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1920,
    THUMBNAIL_SIZE: 150,
  },
  NETWORK: {
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    TIMEOUT: 30000,
  },
};

// Security Constants
export const SECURITY = {
  SESSION: {
    TIMEOUT: 30 * 60 * 1000, // 30 minutes
    RENEWAL_THRESHOLD: 5 * 60 * 1000, // 5 minutes before timeout
  },
  BIOMETRIC: {
    TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  },
  CERTIFICATE_PINNING: {
    ENABLED: true,
    SHA256_HASHES: [
      'pinning_sha256_hash_1',
      'pinning_sha256_hash_2',
    ],
  },
  RATE_LIMIT: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 100,
  },
};

// Animation Constants
export const ANIMATION = {
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    LINEAR: 'linear',
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
    BOUNCE: 'bounce',
    SPRING: 'spring',
  },
  CURVES: {
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
  },
};

// Media Constants
export const MEDIA = {
  TYPES: {
    IMAGE: 'image',
    AUDIO: 'audio',
    VIDEO: 'video',
    DOCUMENT: 'document',
  },
  FORMATS: {
    IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    AUDIO: ['mp3', 'wav', 'ogg', 'aac'],
    VIDEO: ['mp4', 'mov', 'avi', 'webm'],
    DOCUMENT: ['pdf', 'doc', 'docx', 'txt'],
  },
  MAX_SIZES: {
    IMAGE: 5 * 1024 * 1024, // 5MB
    AUDIO: 10 * 1024 * 1024, // 10MB
    VIDEO: 50 * 1024 * 1024, // 50MB
    DOCUMENT: 2 * 1024 * 1024, // 2MB
  },
};

// Error Constants
export const ERROR = {
  CODES: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    AUTH_ERROR: 'AUTH_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  },
  MESSAGES: {
    NETWORK_ERROR: 'Network connection failed',
    AUTH_ERROR: 'Authentication failed',
    VALIDATION_ERROR: 'Invalid input data',
    NOT_FOUND: 'Resource not found',
    RATE_LIMIT_ERROR: 'Too many requests',
    SERVER_ERROR: 'Server error occurred',
    UNKNOWN_ERROR: 'Unknown error occurred',
  },
};

// Time Constants
export const TIME = {
  FORMATS: {
    DATE: 'MMM dd, yyyy',
    TIME: 'HH:mm',
    DATETIME: 'MMM dd, yyyy HH:mm',
    RELATIVE: {
      JUST_NOW: 'just now',
      MINUTES_AGO: '{minutes} minutes ago',
      HOURS_AGO: '{hours} hours ago',
      DAYS_AGO: '{days} days ago',
      WEEKS_AGO: '{weeks} weeks ago',
      MONTHS_AGO: '{months} months ago',
      YEARS_AGO: '{years} years ago',
    },
  },
  ZONES: {
    UTC: 'UTC',
    LOCAL: 'local',
  },
};

// Export all constants as an object for easy access
export const CONSTANTS = {
  APP,
  NAVIGATION,
  API,
  SUPABASE,
  STORAGE,
  AI,
  GAMIFICATION,
  PERFORMANCE,
  SECURITY,
  ANIMATION,
  MEDIA,
  ERROR,
  TIME,
};