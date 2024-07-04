import { argv } from 'process';
import { CookieJar } from 'tough-cookie';
import fetchCookie from 'fetch-cookie';
import now from 'performance-now';
import fs from 'fs';

const cookies = new CookieJar();
const fetchWithCookies = fetchCookie(fetch, cookies);

const loadClientLog = (file, summary) => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.forEach(({data, ms, ok, status}) => {
    summary.requests++;
    summary.totalMillis += ms;
    summary.times.push(ms);
    if (ok && status === 200) {
      summary.successes++;
      summary.totalOkMillis += ms;
      summary.expected.add(JSON.stringify(data));
    } else {
      summary.totalNotOKMillis += ms;
      summary.maybe.add(JSON.stringify(data));
    }
  });
};

let args = argv.slice(2);

let verbose = false;

if (args[0] === '-v') {
  verbose = true;
  args.shift();
}

let [url, ...files] = args;

const summary = {
  requests: 0,
  expected: new Set(),
  maybe: new Set(),
  successes: 0,
  totalMillis: 0,
  totalOkMillis: 0,
  totalNotOkMillis: 0,
  times: [],
};

files.forEach((file) => loadClientLog(file, summary));




const everything = await fetchWithCookies(`${url}/`).then((r) => r.json());
const actual = new Set(everything.map((x) => JSON.stringify(x)));

let expectedPresent = 0;
let maybePresent = 0;

for (const e of summary.expected) {
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

for (const e of summary.maybe) {
  if (actual.has(e)) {
    maybePresent++;
    if (verbose) {
      console.log(`Maybe value ${e} present`);
    }
  }
}

console.log(`expected present: ${expectedPresent} of ${summary.expected.size}`);
console.log(`maybe present: ${maybePresent} of ${summary.maybe.size}`);
console.log(`requests: ${summary.requests}`);
console.log(`success rate: ${summary.successes / summary.requests}`);
console.log(`avg ms: ${summary.totalMillis / summary.requests}`);
console.log(`avg ok ms: ${summary.totalOkMillis / summary.successes}`);
console.log(`avg not ok ms: ${summary.totalNotOkMillis / (summary.requests - summary.successes)}`);
console.log(`p50: ${summary.times.sort()[Math.floor(summary.times.length * 0.5)]}`);
console.log(`p95: ${summary.times.sort()[Math.floor(summary.times.length * 0.95)]}`);
