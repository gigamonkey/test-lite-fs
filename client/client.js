import { argv } from 'process';
import { CookieJar } from 'tough-cookie';
import fetchCookie from 'fetch-cookie';
import now from 'performance-now';
import fs from 'fs';

/*
 * Client tester that spams the server with a bunch of new data and keeps track
 * of what requests it made and whether they succeeded so we can later compare
 * what's in the database with what we expect to be there.
 */

const cookies = new CookieJar();
const fetchWithCookies = fetchCookie(fetch, cookies);

const requests = [];

/**
 * Add stuff to the database and keep track of what we've done, how long it
 * took, and whether it seems to have succeeded.
 */
const addStuff = async (tag, number) => {
  const start = now();
  let ok = true;
  let status = undefined;
  const data = { tag, number };
  try {
    // const r = await fetchWithCookies(url, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data),
    // });
    const r = await fetchWithCookies(`${url}/always-write/${tag}/${number}`);
    status = r.status;
    return true;
  } catch (e) {
    console.log(e);
    ok = false;
    return false;
  } finally {
    const ms = now() - start;
    requests.push({ data, ms, ok, status });
  }
};

const getMe = async (tag) => {
  return fetchWithCookies(`${url}/me?tag=${tag}`);
};

const dumpCookies = () => {
  cookies.getCookies(url, { allPaths: true }, (err, cookies) => {
    if (err) {
      console.error('Error getting cookies:', err);
    } else {
      console.log('Cookies stored in jar:', cookies);
    }
  });
};

let [url, tag, num, delay] = argv.slice(2);

num = Number(num);
delay = Number(delay ?? 0);

const busywait = (ms) => {
  const start = now();
  while (now() - start < ms);
};

try {
  const r = await getMe(tag);

  if (r.status === 200) {
    const start = await r.json();

    console.log(`Starting at: ${JSON.stringify(start)}`);

    const offset = start.max + 1;

    for (let i = 0; i < num; i++) {
      const ok = await addStuff(tag, i + offset);
      process.stdout.write(ok ? '.' : 'X');
      if (i % 60 === 59) process.stdout.write('\n');
      if (delay > 0) busywait(delay);
    }
    process.stdout.write('\n');

    try {
      const end = await getMe(tag).then((r) => r.json());
      console.log(`Ending at: ${JSON.stringify(end)}`);
    } catch {
      console.log('Problem at end');
    }

    fs.writeFileSync(
      `client-${tag}-${offset}-${offset + num - 1}.json`,
      JSON.stringify(requests, null, 2),
    );
  } else {
    console.log(`Couldn't get starting point for tag: ${tag}`);
    console.log(r);
  }
} catch (e) {
  console.log(`Something went boom!`);
  console.log(e);
}
