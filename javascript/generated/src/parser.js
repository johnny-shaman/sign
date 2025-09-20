//ブロックの中を処理する場合、改めてnew Parserを作ることで対応可能

class Parser {
    constructor () {
        this.isStr = false;
        this.isChr = false;
        this.isBlk = false;
    }

    processLine (line) {
        let result = '';
        for (let c of line) {

        }
        return result;
    }
}

module.exports = Parser;
