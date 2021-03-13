const http = require('http');
const fs = require('fs');
const base64js = require('base64-js');

const port = 13224;
var ws = fs.createWriteStream('data.csv', 'utf8');

ws.write('Number 1');
for (let i = 1; i < 32; i++) {
  ws.write(',Number ')
  ws.write((i + 1).toString());
}
for (let i = 0; i < 32; i++) {
  ws.write(',Bool ');
  ws.write((i + 1).toString());
}
ws.write('\n');

http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end();
  // わざわざ http://example.com/ を足さなくても済むようにしたい
  // 回避策を知りたい
  let addr = new URL(req.url, 'http://example.com/');
  if (addr.pathname == '/commit') {

    let b = Buffer.from(base64js.toByteArray
      (addr.searchParams.get('data')
        .replace('-', '+').replace('_', '/')));

    if (b.byteLength != 2 + 33 * 4) {
      return;
    }

    ws.cork();
    ws.write(b.readFloatLE(6).toString());
    for (let i = 1; i < 32; i++) {
      ws.write(',');
      ws.write(b.readFloatLE(6 + i * 4).toString());
    }

    let bools = b.readInt32LE(2);
    for (let i = 0; i < 32; i++) {
      ws.write(',');
      ws.write((((bools >> (32 - i)) & 1)).toString());
    }
    ws.write('\n');
    ws.uncork();
  }
}).listen(port);
