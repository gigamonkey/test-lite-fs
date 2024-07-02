import { argv } from 'process';
import { CookieJar } from 'tough-cookie';
import fetchCookie from 'fetch-cookie';
import now from 'performance-now';
import fs from 'fs';

const cookies = new CookieJar();
const fetchWithCookies = fetchCookie(fetch, cookies);

const loadExpected = (file, expected, maybe) => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.forEach(datum => {
    if (datum.ok) {
      expected.add(JSON.stringify(datum.data));
    } else {
      maybe.add(JSON.stringify(datum.data));
    }
  });
}

let args = argv.slice(2);

let verbose = false;

if (args[0] === '-v') {
  verbose = true;
  args.shift();
}

let [ url, ...files ] = args;

const expected = new Set();
const maybe = new Set();

files.forEach(file => loadExpected(file, expected, maybe));

const everything = await fetchWithCookies(`${url}/`).then(r => r.json());
const actual = new Set(everything.map(x  => JSON.stringify(x)));

let expectedPresent = 0;
let maybePresent = 0;

for (const e of expected) {
  if (actual.has(e)) {
    expectedPresent++;
    if (verbose) {
      console.log(`Expected value ${e} present`);
    }
  } else {
    if (verbose) {
      console.log(`Expected value ${e} missing`);
    }
  }
}

for (const e of maybe) {
  if (actual.has(e)) {
    maybePresent++;
    if (verbose) {
      console.log(`Maybe value ${e} present`);
    }
  }
}

console.log(`expected present: ${expectedPresent} of ${expected.size}`);
console.log(`mabye present: ${maybePresent} of ${maybe.size}`);
