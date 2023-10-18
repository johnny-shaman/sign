const sign = (code) => ({
    split () {
        return code
        .replaceAll(
            /`{2}[\s\S]*?`{2}|`[\s\S]|_[\S]*?_|\[+[\S]*?\]+|[\w]+|[\n]|[{}():;_, ]|[!-'*-/:-@\\^`|~]+/g,
            " $& "
        )
        .replaceAll("\n"," ")
        .split(/ +/g)
        .filter(x => x.length);
    }
});


