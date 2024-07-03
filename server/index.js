import 'dotenv/config';

import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { DB } from 'pugsql';
import fs from 'fs';

const probability500 = 0.0;

// When this is zero things seem to work fine: writes go to the primary and
// reads go to either node and they agree on what's been written. However when I
// set this to, say, 0.05 we lose a fair bit of data. Which is maybe what we
// should expect. I was kind of hoping the LiteFS proxy would note that the
// subprocess had exited but somehow ensure that the latest writes had been sent
// out to other nodes before it exited and let theh machine restart.
const probabilityExit = 0.0;

const args = process.argv.slice(2);

const port = Number(args[0]);
const dbfile = args[1];

const db = new DB(dbfile, 'schema.sql').addQueries('queries.sql');
const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  var cookie = req.cookies.gigamonkeyCookie;
  if (cookie === undefined) {
    const value = Math.random().toString(16);
    res.cookie('gigamonkeyCookie', value, { maxAge: 900000, httpOnly: true });
  }
  next();
});

app.get('/', async (req, res) => {
  res.json(db.stuff());
});

app.post('/', (req, res) => {
  db.insertStuff(req.body);
  if (Math.random() < probability500) {
    console.log(`Sending 500 after saving ${JSON.stringify(req.body)}`);
    res.status(500).send('Ooops!');
  } else if (Math.random() < probabilityExit) {
    console.log(`Crashing after saving ${JSON.stringify(req.body)}`);
    process.exit(1);
  } else {
    res.json(req.body);
  }
});

app.get('/me', (req, res) => {
  res.json(db.me(req.query));
});

const line = '********************************************************************************';

const dumpEndpoints = () => {
  const endpoints = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      endpoints.push(middleware.route.path);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        endpoints.push(handler.route.path);
      });
    }
  });
  return endpoints.sort();
};

if (process.env.DUMP_ROUTES) {
  fs.writeFileSync('routes.txt', dumpEndpoints().join('\n'));
}


app.listen(port, () => console.log(`App is listening on port ${port}\n${line}\n`));
