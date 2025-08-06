module.exports = {
  precedence: {
    "prefix": {
      "#": 1,
      "~": 10,
      "!": 13,
      "$": 21,
      "@": 23
    },
    "infix": {
      ":": 2,
      "#": 3,
      "?": 7,
      ",": 8,
      "~": 9,
      ";": 11,
      "|": 11,
      "&": 12,
      "<": 14,
      "<=": 14,
      "=": 14,
      "==": 14,
      ">=": 14,
      ">": 14,
      "!=": 14,
      "+": 15,
      "-": 15,
      "*": 16,
      "/": 16,
      "%": 16,
      "^": 17,
      "'": 22,
      "@": 22
    },
    "postfix": {
      "!": 18,
      "~": 20,
      "@": 24
    },
    "surrounding": {
      prefix: {
        "|": 19,
        "(": 25,
        "[": 25,
        "{": 25
      },
      postfix: {
        "|": 19,
        ")": 25,
        "]": 25,
        "}": 25
      }
    },
    "associativity": {
      "#": "right",
      ":": "right",
      "?": "right",
      ",": "right",
      "^": "right",
      "@": "right"
    },
    "special": {
      "_": "unit",
      "\t": "indent",
      "\n": "newline"
    }
  },

  getPrecedence (op) {
    return this.precedence.prefix[op] ||
           this.precedence.infix[op] ||
           this.precedence.postfix[op] ||
           this.precedence.surrounding.prefix[op] ||
           this.precedence.surrounding.postfix[op] ||
           null;
  },

  toPrefix (op) {
    if (this.precedence.prefix[op] || this.precedence.surrounding.prefix[op]) {
      return `[${op}_]`;
    } else if (this.precedence.infix[op]) {
      return `[${op}]`;
    } else if (this.precedence.postfix[op] || this.precedence.surrounding.postfix[op]) {
      return `[_${op}]`;
    } else {
      return undefined;
    }
  },

  getAssociativity (op) {
    if (this.precedence.associativity[op]) {
      return this.precedence.associativity[op];
    } else {
      return "left"; // Default associativity
    }
  }
}