export default parser = {
  async expression (c, s) {
    f[c](s)
  }
}

const f = {
  " " (s) {
    
  },
  "/r/n" (s) {
    return f["/n"](s);
  },
  "/r" (s) {
    return f["/n"](s);
  },
  "/n" (s) {

  },
  "/t" (s) {
    return {
      block : parser.expression(s)
    }
  },
  "@" (s) {

  },
  "'" (s) {

  },
  "#" (s) {

  }
};