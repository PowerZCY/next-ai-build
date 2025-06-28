import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { DevScriptsConfig } from '@dev-scripts/config/schema'

export class Logger {
  private messages: string[] = []
  private config: DevScriptsConfig
  
  constructor(config: DevScriptsConfig) {
    this.config = config
  }
  
  log(message: string): void {
    if (this.config.output.verbose) {
      console.log(message)
    }
    this.messages.push(message)
  }
  
  error(message: string): void {
    console.error(message)
    this.messages.push('[ERROR] ' + message)
  }
  
  warn(message: string): void {
    console.warn(message)
    this.messages.push('[WARN] ' + message)
  }
  
  info(message: string): void {
    console.info(message)
    this.messages.push('[INFO] ' + message)
  }
  
  success(message: string): void {
    console.log(`✅ ${message}`)
    this.messages.push(`[SUCCESS] ${message}`)
  }
  
  /**
   * save log to file
   */
  saveToFile(filename: string, cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'): void {
    try {
      const logFilePath = join(cwd, this.config.output.logDir, filename)
      const logDir = dirname(logFilePath)
      
      // create log directory if it doesn't exist
      mkdirSync(logDir, { recursive: true })
      
      writeFileSync(logFilePath, this.messages.join('\n'), 'utf8')
      console.log(`log saved to ${logFilePath}`)
    } catch (error) {
      console.error(`failed to save log file: ${error}`)
    }
  }
  
  /**
   * clear log messages
   */
  clear(): void {
    this.messages = []
  }
  
  /**
   * get all log messages
   */
  getMessages(): string[] {
    return [...this.messages]
  }
} 