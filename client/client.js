import { argv } from 'process';

const [ url ] = argv.slice(2)

const addStuff = async (tag, number) => {
  return fetch(url, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({tag, number}),
  });
};

const getMe = async (tag) => {
  return fetch(`${url}/me?tag=${tag}`);
}

//const r = await fetch(url);

//console.log(await r.json());

console.log(await addStuff('a', 1).then(r => r.json()));
console.log(await getMe('a').then(r => r.json()));
