/**
 * 汎用ストリーム区切りプロセッサ
 * 
 * ストリームデータを指定された区切り文字で分割し、
 * 各区切り文字に対応したハンドラ関数で処理するライブラリ
 */

const fs = require('fs');
const path = require('path');
const { Transform } = require('stream');
const { StringDecoder } = require('string_decoder');

/**
 * 区切り文字ごとに異なる処理を行うTransformストリーム
 */
class DelimiterProcessorTransform extends Transform {
  /**
   * @param {Object} handlers - 区切り文字とそれに対応するハンドラ関数のマップ
   * @param {Object} options - ストリームオプション
   */
  constructor(handlers, options = {}) {
    super({ ...options, objectMode: true });
    
    // ハンドラが有効か確認
    if (!handlers || typeof handlers !== 'object' || Object.keys(handlers).length === 0) {
      throw new Error('少なくとも1つの区切り文字ハンドラを指定してください');
    }
    
    // ハンドラの登録
    this.handlers = { ...handlers };
    
    // 区切り文字の抽出（特殊キーは除外）
    this.delimiters = Object.keys(handlers).filter(key => 
      key !== null && key !== 'default' && key !== 'options'
    );
    
    if (this.delimiters.length === 0) {
      throw new Error('少なくとも1つの有効な区切り文字が必要です');
    }
    
    this.buffer = '';
    this.decoder = new StringDecoder('utf8');
    
    // デフォルトオプション
    this.options = {
      includeDelimiter: false,  // 区切り文字自体も結果に含めるか
      trimData: true,           // データの前後の空白を削除するか
      maxBufferSize: 1024 * 1024 * 10, // 最大バッファサイズ (10MB)
      ...((handlers.options || {}))
    };
    
    // 状態の初期化
    this.bufferSize = 0;
    this.segmentCount = 0;
  }
  
  _transform(chunk, callback) {
    // チャンクをバッファに追加
    const chunkStr = this.decoder.write(chunk);
    this.buffer += chunkStr;
    this.bufferSize += Buffer.byteLength(chunkStr);
    
    // バッファサイズのチェック
    if (this.bufferSize > this.options.maxBufferSize) {
      callback(new Error(`バッファサイズが上限を超えました (${this.bufferSize} > ${this.options.maxBufferSize})`));
      return;
    }
    
    // バッファを処理
    try {
      this._processBuffer();
      callback();
    } catch (err) {
      callback(err);
    }
  }
  
  _flush(callback) {
    try {
      // デコーダの残りを追加
      this.buffer += this.decoder.end();
      
      // 残りのバッファを処理
      this._processBuffer();
      
      // バッファに残ったものがあれば、最後のチャンクとして出力
      if (this.buffer.length > 0) {
        // データをトリムするかどうか
        const data = this.options.trimData ? this.buffer.trim() : this.buffer;
        
        if (data.length > 0) {
          // デフォルトハンドラがあれば使用
          const defaultHandler = this.handlers.default || this.handlers[null];
          if (typeof defaultHandler === 'function') {
            const result = defaultHandler(data);
            if (result !== undefined) {
              this.push(result);
              this.segmentCount++;
            }
          } else {
            // デフォルトハンドラがなければそのまま出力
            this.push(data);
            this.segmentCount++;
          }
        }
        this.buffer = '';
        this.bufferSize = 0;
      }
      
      callback();
    } catch (err) {
      callback(err);
    }
  }
  
  _processBuffer() {
    let foundDelimiter = true;
    
    // 区切り文字が見つからなくなるまで繰り返し処理
    while (foundDelimiter && this.buffer.length > 0) {
      foundDelimiter = false;
      let minIndex = Infinity;
      let foundDelim = '';
      
      // すべての区切り文字を確認し、最初に現れる区切り文字を特定
      for (const delimiter of this.delimiters) {
        const index = this.buffer.indexOf(delimiter);
        
        if (index !== -1 && index < minIndex) {
          minIndex = index;
          foundDelim = delimiter;
          foundDelimiter = true;
        }
      }
      
      // 区切り文字が見つかった場合
      if (foundDelimiter) {
        // 区切り文字までのデータを取得
        let data = this.buffer.slice(0, minIndex);
        const delimiterLength = foundDelim.length;
        
        // データをトリムするかどうか
        if (this.options.trimData) {
          data = data.trim();
        }
        
        // 区切り文字も含めるかどうか
        const delimiterContent = this.options.includeDelimiter ? foundDelim : '';
        
        // 対応するハンドラ関数を実行
        const handler = this.handlers[foundDelim];
        if (typeof handler === 'function' && (data.length > 0 || !this.options.trimData)) {
          try {
            const result = handler(data, delimiterContent);
            if (result !== undefined) {
              this.push(result);
              this.segmentCount++;
            }
          } catch (err) {
            throw new Error(`ハンドラ実行エラー (区切り文字: "${foundDelim}"): ${err.message}`);
          }
        }
        
        // バッファを更新（区切り文字の長さ分進める）
        this.buffer = this.buffer.slice(minIndex + delimiterLength);
        this.bufferSize = Buffer.byteLength(this.buffer);
      }
    }
  }
  
  /**
   * 処理したセグメント数を取得
   */
  getSegmentCount() {
    return this.segmentCount;
  }
}

/**
 * ストリームデータを指定された区切り文字で分割して処理する
 * @param {Readable} inputStream - 入力ストリーム
 * @param {Object} handlers - 区切り文字とハンドラ関数のマップ
 * @param {Function} dataCallback - 処理されたデータを受け取るコールバック
 * @returns {Promise<Object>} - 処理結果の情報
 */
function processStreamWithHandlers(inputStream, handlers, dataCallback) {
  return new Promise((resolve, reject) => {
    const processor = new DelimiterProcessorTransform(handlers);
    
    let count = 0;
    
    const stream = inputStream
      .pipe(processor)
      .on('data', (chunk) => {
        count++;
        if (typeof dataCallback === 'function') {
          dataCallback(chunk, count);
        }
      })
      .on('end', () => {
        resolve({
          count: processor.getSegmentCount(),
          success: true
        });
      })
      .on('error', (err) => {
        reject(err);
      });
    
    return stream;
  });
}

/**
 * ファイルを読み込んで区切り文字ハンドラで処理する
 * @param {string} filePath - 読み込むファイルのパス
 * @param {Object} handlers - 区切り文字とハンドラ関数のマップ
 * @param {Function} dataCallback - 処理されたデータを受け取るコールバック
 * @returns {Promise<Object>} - 処理結果の情報
 */
function processFileWithHandlers(filePath, handlers, dataCallback) {
  return new Promise((resolve, reject) => {

    // ファイルが存在するか確認
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`ファイルが見つかりません: ${filePath}`));
    }
    
    // ファイルのストリームを作成
    const inputStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    
    return processStreamWithHandlers(inputStream, handlers, dataCallback)
      .then(resolve)
      .catch(reject);
  });
}

/**
 * テキストを区切り文字ハンドラで処理する
 * @param {string} text - 処理するテキスト
 * @param {Object} handlers - 区切り文字とハンドラ関数のマップ
 * @param {Function} dataCallback - 処理されたデータを受け取るコールバック
 * @returns {Promise<Object>} - 処理結果の情報
 */
function processTextWithHandlers(text, handlers, dataCallback) {
  return new Promise((resolve, reject) => {
    const { Readable } = require('stream');
    
    // テキストからストリームを作成
    const inputStream = Readable.from([text]);
    
    return processStreamWithHandlers(inputStream, handlers, dataCallback)
      .then(resolve)
      .catch(reject);
  });
}

// モジュールとしてエクスポート
module.exports = {
  DelimiterProcessorTransform,
  processStreamWithHandlers,
  processFileWithHandlers,
  processTextWithHandlers
};
