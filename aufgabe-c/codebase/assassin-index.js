const path = require('path');
const fs = require("fs");
const express = require('express');
const crypto = require("crypto");
const ws = require('ws')
require('module-alias/register');

const QRCode = require('qrcode');

const GameManager = require('@managers/GameManager');
const LobbyManager = require('@managers/LobbyManager');

const comm_players = require('@communication/comm_players');
const comm_gamemaster = require('@communication/comm_gamemaster');

const app = express();
app.set('view engine', 'ejs')
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

const port = 12000;
const server = app.listen(port, () => {
  console.log(`HTTP server running on port ${port}`);
});

server.on('upgrade', (request, socket, head) => {
	const url = new URL(request.url, `http://${request.headers.host}`);
  
	if (url.pathname === '/gamemaster') {
		comm_gamemaster.wss.handleUpgrade(request, socket, head, (ws) => {
			comm_gamemaster.wss.emit('connection', ws, request);
	  	});
	  	return;
	}
  
	if (url.pathname === '/players') {
		comm_players.wss.handleUpgrade(request, socket, head, (ws) => {
			comm_players.wss.emit('connection', ws, request);
	  	});
	  	return;
	}
  
	socket.destroy();
});

app.get(`/gamemaster-4204129586`, async (req, res) => {
	res.render("gamemaster/overview", {});
})

app.get('/', async (req, res) => {
	res.render("players/lobby", {});
})