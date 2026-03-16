/**
 * Centralized logging utility for Lighthouse
 * Provides consistent logging across the application with environment-aware behavior
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

// Get log level from environment or default to INFO in development, ERROR in production
const getDefaultLogLevel = (): LogLevel => {
  if (typeof window === 'undefined') return LogLevel.INFO;

  const isDev = import.meta.env?.DEV ?? import.meta.env?.MODE === 'development';
  return isDev ? LogLevel.DEBUG : LogLevel.ERROR;
};

let currentLogLevel: LogLevel = getDefaultLogLevel();

/**
 * Set the minimum log level. Messages below this level will not be logged.
 */
export const setLogLevel = (level: LogLevel): void => {
  currentLogLevel = level;
};

/**
 * Get the current log level.
 */
export const getLogLevel = (): LogLevel => currentLogLevel;

/**
 * Logger interface for tagged logging
 */
export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * Format log message with timestamp and tag
 */
const formatMessage = (tag: string, ...args: unknown[]): unknown[] => {
  const timestamp = new Date().toISOString();
  return [`[${timestamp}] [${tag}]`, ...args];
};

/**
 * Check if a log level should be output
 */
const shouldLog = (level: LogLevel): boolean => {
  return level >= currentLogLevel;
};

/**
 * Create a logger with a specific tag
 */
export const createLogger = (tag: string): Logger => ({
  debug: (...args: unknown[]) => {
    if (shouldLog(LogLevel.DEBUG)) {
      console.debug(...formatMessage(tag, ...args));
    }
  },
  info: (...args: unknown[]) => {
    if (shouldLog(LogLevel.INFO)) {
      console.info(...formatMessage(tag, ...args));
    }
  },
  warn: (...args: unknown[]) => {
    if (shouldLog(LogLevel.WARN)) {
      console.warn(...formatMessage(tag, ...args));
    }
  },
  error: (...args: unknown[]) => {
    if (shouldLog(LogLevel.ERROR)) {
      console.error(...formatMessage(tag, ...args));
    }
  },
});

/**
 * Default logger for general use
 */
export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog(LogLevel.DEBUG)) {
      console.debug(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (shouldLog(LogLevel.INFO)) {
      console.info(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (shouldLog(LogLevel.WARN)) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (shouldLog(LogLevel.ERROR)) {
      console.error(...args);
    }
  },
};

/**
 * Log error with context - useful for error tracking
 */
export const logError = (error: Error | unknown, context?: string): void => {
  const message = context ? `${context}: ` : '';
  if (error instanceof Error) {
    logger.error(message + error.message, error.stack);
  } else {
    logger.error(message + String(error));
  }
};

/**
 * Development-only logging (stripped in production)
 */
export const devLog = (...args: unknown[]) => {
  if (import.meta.env?.DEV) {
    console.log('[DEV]', ...args);
  }
};

/**
 * Assert helper that logs in development
 */
export const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    if (import.meta.env?.DEV) {
      throw new Error(`Assertion failed: ${message}`);
    }
    logger.warn(`Assertion failed: ${message}`);
  }
};
