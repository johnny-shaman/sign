module.exports = function (regex, string) {
    const matches = string.matchAll(regex);
    if (!matches) return [string];
    
    const result = [];
    let lastIndex = 0;
    
    for (const match of matches) {
        const matchStart = match.index;
        // マッチ前の部分があれば追加
        if (matchStart > lastIndex) {
            result.push(string.slice(lastIndex, matchStart));
        }
        // マッチ部分を配列として追加
        result.push([match[0]]);
        lastIndex = matchStart + match[0].length;
    }
    
    // 残りの部分があれば追加
    if (lastIndex < string.length) {
        result.push(string.slice(lastIndex));
    }
    
    return result;
};
