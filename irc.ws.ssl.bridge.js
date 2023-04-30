const WebSocket = require('ws');
const net = require('net');
const https = require('https');
const fs = require('fs');

const WS_PORT = 8080; // WebSocket server port
const TCP_HOST = 'localhost';
const TCP_PORT = 6667; // IRC default port

const sslOptions = {
  key: fs.readFileSync('/path/to/ssl/key.pem'),
  cert: fs.readFileSync('/path/to/ssl/cert.pem'),
};

const wss = new WebSocket.Server({ port: WS_PORT, server: https.createServer(sslOptions) });
const tcpClient = new net.Socket();

tcpClient.connect(TCP_PORT, TCP_HOST, () => {
  console.log(`Connected to IRC server at ${TCP_HOST}:${TCP_PORT}`);
});

tcpClient.on('data', (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
});

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    tcpClient.write(message + '\r\n');
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

