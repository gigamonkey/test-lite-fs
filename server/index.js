import 'dotenv/config';

import express from 'express';
import { DB } from 'pugsql';

const db = new DB(process.env.DATABASE_URL, 'schema.sql').addQueries('queries.sql');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
  res.send('hello');
});

app.get('/stuff', (req, res) => {
  res.json(db.stuff());
});

app.get('/me', (req, res) => {
  res.json(db.me(req.query));
});

app.post('/',  (req, res) => {
  console.log(req.body);
  db.insertStuff(req.body);
  if (Math.random() < 0.1) {
    console.log(`Crashing after saving ${JSON.stringify(req.body)}`);
    process.exit(1);
  }
  res.json(req.body);
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

const port = Number(process.env.PORT)

app.listen(port, () => console.log(`App is listening on port ${port}\n${line}\n`));
