/**
 * Logger utility for development and production
 * In development: logs to console
 * In production: logs are suppressed except for errors
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private isDev = import.meta.env.DEV

  debug(message: string, data?: any) {
    if (this.isDev) {
      console.debug(`[DEBUG] ${message}`, data)
    }
  }

  info(message: string, data?: any) {
    if (this.isDev) {
      console.info(`[INFO] ${message}`, data)
    }
  }

  warn(message: string, data?: any) {
    console.warn(`[WARN] ${message}`, data)
  }

  error(message: string, error?: any) {
    console.error(`[ERROR] ${message}`, error)
  }
}

export const logger = new Logger()
