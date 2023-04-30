const readline = require('readline');
const net = require('net');

const HOST = 'localhost';
const PORT = 6667; // IRC default port

const client = new net.Socket();

client.connect(PORT, HOST, () => {
  console.log(`Connected to IRC server at ${HOST}:${PORT}`);
});

client.on('data', (data) => {
  process.stdout.write(data); // display incoming data from server
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on('line', (line) => {
  if (line === '') return; // ignore empty lines
  client.write(line + '\r\n'); // send message to server
});

