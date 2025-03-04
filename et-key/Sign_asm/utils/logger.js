// utils/logger.js
/**
 * コンパイラのログ出力ユーティリティ
 * 
 * 機能:
 * - 異なるログレベル（INFO, DEBUG, ERROR）のサポート
 * - タイムスタンプ付きログ出力
 * - 色付きコンソール出力
 * 
 * 使用方法:
 * const { logger } = require('./utils/logger');
 * logger.info('情報メッセージ');
 * logger.debug('デバッグ情報');
 * logger.warn('警告レベル情報')
 * logger.error('エラーメッセージ');
 * CreateBy Claude3.7Sonet
 * ver_20250304_0
*/

// ANSIエスケープシーケンスによる色定義
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

class Logger {
    constructor() {
        this.debugMode = process.env.DEBUG === 'true';
    }

    // タイムスタンプの生成
    getTimestamp() {
        return new Date().toISOString();
    }

    // 情報レベルのログ
    info(message, ...args) {
        const timestamp = this.getTimestamp();
        console.log(`${colors.green}[INFO]${colors.reset} ${colors.dim}${timestamp}${colors.reset} ${message}`);
        if (args.length > 0) {
            console.log(...args);
        }
    }

    // 処理経過のログ
    progress(stage, lineNumber, content) {
        const prefix = `${colors.yellow}>${lineNumber}行目_${stage}:${colors.reset}`;
        console.log(`${prefix} ${content}`);
    }

    // デバッグレベルのログ
    debug(message, ...args) {
        if (this.debugMode) {
            const timestamp = this.getTimestamp();
            console.log(`${colors.blue}[DEBUG]${colors.reset} ${colors.dim}${timestamp}${colors.reset} ${message}`);
            if (args.length > 0) {
                console.log(...args);
            }
        }
    }

    // 警告レベルのログ
    warn(message, ...args) {
        const timestamp = this.getTimestamp();
        console.warn(`${colors.yellow}[WARNING]${colors.reset} ${colors.dim}${timestamp}${colors.reset} ${message}`);
        if (args.length > 0) {
            console.warn(...args);
        }
    }

    // エラーレベルのログ
    error(message, ...args) {
        const timestamp = this.getTimestamp();
        console.error(`${colors.red}[ERROR]${colors.reset} ${colors.dim}${timestamp}${colors.reset} ${message}`);
        if (args.length > 0) {
            console.error(...args);
        }
    }
}

// シングルトンインスタンスとしてエクスポート
const logger = new Logger();
module.exports = { logger };