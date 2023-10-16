function Tokenizer (string) {
    return string
    .replaceAll(/(\[`.+`\])|_[\W]+_|[\w]+/g, " $& ")
    .replaceAll("\n"," ")
    .split(/ +/g)
    .filter(x => x.length);
}




