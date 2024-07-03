# Test LiteFS

## Questions to answer

- If the primary crashes does the secondary seamlessly take over as primary?

  *Yes. The key thing seems to be that (perhaps obviously in retrospect) the
  secondary has to be already started. I.e. you can't count on fly to start a
  stopped machine to take over because that machine won't have been getting synced
  with the primary. But if another machine is up and part of the LiteFS cluster it
  appears it will just take over, no problem.*

- How quickly? Do clients get slower responses or any failed/timedout responses?
  (I guess if we have the server exit before sending the response, there will be
  at least some failed requests, but technically the data should be stored
  before each crash.)

  *When my server process exits the LiteFS proxy sends a 502 response*

- Do readers always see up to date data, meaning, if they read do they see a) at
  least everything they've written and b) everything they've read before.

  *I don't see any evidence that they don't. I haven't tested this is carefully;
  most of my tests were shaped like write a bunch of stuff with some
  intermittent crashes or machine stops and then checking that everything was
  there at the end.*

- Assuming readers do only see up to date data, does that ever introduce
  noticible latency on their requests. (My understanding is that the LiteFS
  proxy holds up the request until the node handling the request's TXID is at
  least as high as the one in the client

  *Haven't really tested this yet. Need to do a read heavy test while writes are
  going on.*

- Does the configuration option discussed here
  https://community.fly.io/t/litefs-http-proxy-failing-with-nextauth/15917/3
  actually work to make some GET requests get routed to the primary.

  *Not tested at all yet.*

## Basic client plan

Clients make a number of requests to the server, to store a numbered sequence of
items and keep track locally of how many requests were made, how long they took,
and what the response code was or error if no response is returned.

- Style 1: Make a series of write requests and at the end fetch the total state
  and compare to what we expect.

- Style 2: Make a series of interleaved write requests and requests for the
  latest state to compare with what we expect.

## Server

The server handles requests and on the write path, with some probability, exits
after writing to the database. Assuming no *other* crashes that means all writes
should go to the database and if everything works as expected a new server will
take over as the primary and we (mostly) won’t lose any data.

- Style 1: Server exits before sending a response. From the client’s point of
  view we don’t know what happened to that write.

- Style 2: Server sets a timeout to exit some short time after sending a
  response. This is trying to simulate the scenario where the primary crashes at
  the worst possible time—right after the success response has been sent to the
  client but before the asynchronous propagation of the write has actually made
  it to any other nodes. This scenario actually loses data so we want to see how
  easy it is to trigger.

## Some assumptions

- ~~A fly machine stops as soon as the process it is running exits. (Technically
  I guess the LiteFS proxy is really the main process so maybe if my server
  exits the LiteFS proxy can still do stuff. Which would actually be good but
  means I can’t easily simulate crash of the fly machine by just exiting my
  server.)~~ It seems that the Fly Machine runner keeps the machine alive and
  just restarts the process, which makes sense. I guess that's fine for my
  purposes. Again, not sure yet what happens when the LiteFS proxy gets added to
  the mix.
