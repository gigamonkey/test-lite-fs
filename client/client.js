import { argv } from 'process';
import { CookieJar } from 'tough-cookie';
import fetchCookie from 'fetch-cookie';
import now from 'performance-now';

const cookies = new CookieJar();
const fetchWithCookies = fetchCookie(fetch, cookies);

const requests = [];

const timedFetch = async (...args) => {
  const start = now();
  let ok = true;
  let status = undefined;
  try {
    const r = await fetchWithCookies(...args);
    status = r.status;
    return r;
  } catch (e) {
    ok = false;
    return undefined;
  } finally {
    const ms = now() - start;
    requests.push({ ms, ok, status });
  }
};

const addStuff = async (tag, number) => {
  return timedFetch(url, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({tag, number}),
  });
};

const getMe = async (tag) => {
  return fetchWithCookies(`${url}/me?tag=${tag}`);
}

const dumpCookies = () => {
  cookies.getCookies(url, { allPaths: true }, (err, cookies) => {
    if (err) {
      console.error('Error getting cookies:', err);
    } else {
      console.log('Cookies stored in jar:', cookies);
    }
  });
};


let [ url, tag, num, delay ] = argv.slice(2);

num = Number(num);
delay = Number(delay);

const start = await getMe(tag).then(r => r.json());

console.log(start);

const offset = start.max + 1;

const busywait = (ms) => {
  const start = now();
  while (now() - start < ms);
}

for (let i = 0; i < num; i++) {
  const r = await addStuff(tag, i + offset);
  if (delay > 0) busywait(delay);
}

try {
  console.log(await getMe('a').then(r => r?.json()));
} catch {
  console.log('Problem at end');
}

//dumpCookies();

requests.forEach(r => console.log(JSON.stringify(r)));
