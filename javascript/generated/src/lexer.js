
//　Normalize line endings and split lines

module.exports = code => code
    .replace(/^`[\s\S]+$`?/gm, '') // Remove Comments
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\xA0\xAD]/g, '') // Remove Control Characters
    .replace(/\r\n|[\r\n]/g, '\r')
    .replace(/\r(\t+)/g, '\n$1')
    .replace(/\\\r/g, '\\\n')
    .split('\r')
    .map(
        line => line.match(/^\t+/gm)
            ? line
            : line
                .replace(/( )|(\\[\s\S])|(`[^`\n\r]+`)/g, '\x1F$2$3')
                .replace(/^\x1F+/gm, '')
                .replace(/[\x1F]{2,}/g, '\x1F')
                .split('\x1F')
    );
