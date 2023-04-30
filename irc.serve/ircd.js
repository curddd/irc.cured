const net = require('net');

const PORT = 6667; // IRC default port
const server = net.createServer();

let clients = [];

server.on('connection', (client) => {
  clients.push(client);
  console.log(`New client connected: ${client.remoteAddress}:${client.remotePort}`);

  client.write('Welcome to the IRC server!');

  client.on('data', (data) => {
    console.log(`Received data from client: ${data}`);

    // broadcast message to all connected clients
    clients.forEach((c) => {
        c.write(`${data}`);
    });
  });

  client.on('end', () => {
    clients = clients.filter((c) => c !== client);
    console.log(`Client disconnected: ${client.remoteAddress}:${client.remotePort}`);
  });
});

server.listen(PORT, () => {
  console.log(`IRC server listening on port ${PORT}`);
});

