const sign = (code) => ({
    split () {
        return code
        .replaceAll(/(\[`.+`\])|_[\W]+_|[\w]+/g, " $& ")
        .replaceAll("\n"," ")
        .split(/ +/g)
        .filter(x => x.length);
    }
});


