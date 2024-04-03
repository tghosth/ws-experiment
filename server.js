/**
Before running:
> npm install ws
Then:
> node server.js
> open http://localhost:7070 in the browser
*/

const http = require('http');
const fs = require('fs');
const ws = new require('ws');
const url = require('url');

const wss = new ws.Server({ noServer: true });

const clients = new Set();

function accept(req, res) {

  var url_parts = url.parse(req.url, true);
  const queryParams = url_parts.query;
  console.log(url_parts)
  console.log(queryParams)
  if (req.url == '/') { // index.html
    fs.createReadStream('./index.html').pipe(res);
  }
  else if (req.headers['x-auth'] == "AUTHED" || queryParams['auth'] == "AUTHED") {


    if (url_parts.pathname == '/ws' && req.headers.upgrade &&
      req.headers.upgrade.toLowerCase() == 'websocket' &&
      // can be Connection: keep-alive, Upgrade
      req.headers.connection.match(/\bupgrade\b/i)) {
      wss.handleUpgrade(req, req.socket, Buffer.alloc(0), onSocketConnect);
    }
    else if (url_parts.pathname == '/authed') {

      

      // Convert the object into an array of key-value pairs
      //const queryParamsArray = Object.entries(queryParams);

      let message = ''
      message = `Hi ${queryParams['username']}`
      res.write(message);
      //res.writeHead(200);
      res.end();

    } else { // page not found
      res.writeHead(404);
      res.end();
    }
  }
  else {
    res.writeHead(401);
    res.end();
  }
}

function onSocketConnect(ws) {
  clients.add(ws);
  log(`new connection`);

  ws.on('message', function (message) {
    log(`message received: ${message}`);

    message = message.slice(0, 50); // max message length will be 50

    for (let client of clients) {
      client.send(`${message}`);
    }
  });

  ws.on('close', function () {
    log(`connection closed`);
    clients.delete(ws);
  });
}

let log;
if (!module.parent) {
  log = console.log;
  http.createServer(accept).listen(7070);
} else {
  // to embed into javascript.info
  log = function () { };
  // log = console.log;
  exports.accept = accept;
}