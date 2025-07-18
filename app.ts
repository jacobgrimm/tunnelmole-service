//@ts-ignore
import tunnelmoleConnections from './src/handlers/tunnelmole-connections';
import handleRequest from './src/handlers/handle-request';
import logTelemetry from './src/handlers/log-telemetry';

import express from 'express';
import bodyParser from 'body-parser';
import unreserveSubdomain from './src/handlers/unreserve-subdomain';
import path from 'path';
const app = express();

// Serve static files from public directory
app.use('/dashboard', express.static(path.join(__dirname, '..', 'public')));

// Serve dashboard HTML for root requests
app.get('/', (req, res) => {
  res.redirect('/dashboard/');
});

// Serve dashboard directly for API Gateway requests
app.get('/dashboard/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Body will be a Buffer, easy to transfer to the client untouched
const options = {
  inflate: false,
  type: '*/*'
};

app.use(bodyParser.raw(options));

app.get("/tunnelmole-connections", tunnelmoleConnections);
app.post("/tunnelmole-log-telemetry", logTelemetry);
app.delete("/tunnelmole/unreserve-subdomain", unreserveSubdomain);

/**
 * Handle incoming HTTP(s) requests for existing connections
 */
app.all("*", handleRequest);

/**
 * Initialize a new WebSocket connection with a Client
 */
export default app;