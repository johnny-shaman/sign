import {preprocess} from './tokenize.mjs';
const fileIN = process.argv[2];

preprocess(fileIN).catch(console.error);