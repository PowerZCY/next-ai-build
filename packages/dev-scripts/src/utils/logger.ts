import { writeFileSync } from 'fs'
import { join } from 'path'
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
   * 保存日志到文件
   */
  saveToFile(filename: string, cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'): void {
    try {
      const logFilePath = join(cwd, this.config.output.logDir, filename)
      writeFileSync(logFilePath, this.messages.join('\n'), 'utf8')
      console.log(`日志已保存到 ${logFilePath}`)
    } catch (error) {
      console.error(`保存日志文件失败: ${error}`)
    }
  }
  
  /**
   * 清空日志消息
   */
  clear(): void {
    this.messages = []
  }
  
  /**
   * 获取所有日志消息
   */
  getMessages(): string[] {
    return [...this.messages]
  }
} 