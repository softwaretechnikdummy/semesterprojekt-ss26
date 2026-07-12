const ws = require('ws');

const LobbyManager = require('@managers/LobbyManager');
const GameManager = require('@managers/GameManager');

const wss_players = new ws.WebSocketServer({ noServer: true });

wss_players.on('connection', (ws, req) => {
	ws.lastHeartbeat = Date.now();
	console.log('[wss_players] WebSocket client connected');
  
	ws.on('message', (data) => {
		const message_str = data.toString();
		const message = JSON.parse(message_str);
		if (message.type == 'ping') {
			ws.lastHeartbeat = Date.now();
		}
		if (message.type == 'register') {
			var code = LobbyManager.Register();
			LobbyManager.SetOnline(code, true);
			console.log(`[wss_players] new player registered as: ${code}`)
			ws.code = code;

			ws.send(JSON.stringify({
				type: 'register',
				data: code
			}))
		}
		if (message.type == 'login') {
			var code = message.data;
			if (LobbyManager.IsRegistered(code)) {
				ws.code = code;
				console.log(`[wss_players] known agent joined: ${code}`);
				LobbyManager.SetOnline(code, true);
				exports.UpdateGameState(code);
			} else {
				var code_new = LobbyManager.Register();
				LobbyManager.SetOnline(code_new, true);
				console.log(`[wss_players] agent code ${code} not valid -> re-register as ${code_new}`);
				ws.code = code_new;
				ws.send(JSON.stringify({
					type: 'register',
					data: code_new
				}))
			}
		}
		if (message.type == 'player_reportkill') {
			var player_gamestate = GameManager.GetPlayerGameState(ws.code);
			if (!player_gamestate) {
				console.log(`[wss_players] player reported kill without having gamestate (${ws.code})`)
				return;
			}
			if (!player_gamestate.target) {
				console.log(`[wss_players] player reported kill without having target (${ws.code})`)
				return;
			}
			var target_node = GameManager.GetNodeFromUUID(player_gamestate.target.uuid);
			if (!target_node) {
				console.log(`[wss_players] target in player gamestate is invalid -> THIS SHOULD NEVER HAPPEN (${ws.code})`)
				return;
			}

			if (target_node.code == message.data) {
				console.log(`[wss_players] player reported kill (player=${player_gamestate.name},target=${target_node.text})`)
				ws.send(JSON.stringify({
					type: 'player_reportkill',
					data: {
						success: true,
						name: target_node.text,
						kills: player_gamestate.kills+1
					}
				}));
				GameManager.ExecuteKill(ws.code, target_node.uuid);
			} else {
				console.log(`[wss_players] player reported kill with wrong code (player=${player_gamestate.name},target=${target_node.text},is=${message.data},should=${target_node.code})`)
				ws.send(JSON.stringify({
					type: 'player_reportkill',
					data: {
						success: false
					}
				}))
			}
		}
		if (message.type == 'player_redrawword') {
			ws.send(JSON.stringify({
				type: 'player_redraw',
				data: GameManager.RedrawWord(ws.code)
			}))
		}
	});
  
	ws.on('close', () => {
	  console.log(`[wss_players] WebSocket client disconnected (code: ${ws.code})`);
	  if (ws.code) {
		LobbyManager.SetOnline(ws.code, false);
	  }
	});
});

const HEARTBEAT_TIMEOUT = 20_000;
const CHECK_INTERVAL = 5_000;

const interval = setInterval(() => {
  const now = Date.now();

  for (const ws of wss_players.clients) {
    if (ws.readyState !== ws.OPEN) continue;

    if (now - ws.lastHeartbeat > HEARTBEAT_TIMEOUT) {
      console.log(`[wss_players] Terminating stale client (code: ${ws.code})`);
      ws.terminate();
    }
  }
}, CHECK_INTERVAL);

exports.UpdateGameState = function(lobby_code) {
	if (!lobby_code) return;
    for (const ws of wss_players.clients) {
        if (ws.readyState !== ws.OPEN) continue;

		if (ws.code == lobby_code) {
			var player_gamestate = GameManager.GetPlayerGameState(lobby_code);
			if (player_gamestate) {
				ws.send(JSON.stringify({
					type: 'player_gamestate',
					data: player_gamestate
				}));
			} else {
				ws.send(JSON.stringify({
					type: 'lobby_keepwaiting',
					data: null
				}));
			}
		}
    }
}

exports.UpdateAllGameStates = function() {
    for (const ws of wss_players.clients) {
        if (ws.readyState !== ws.OPEN) continue;
		if (ws.code) {
			exports.UpdateGameState(ws.code);
		}
	}
}

exports.Reset = function() {
    for (const ws of wss_players.clients) {
        if (ws.readyState !== ws.OPEN) continue;
		if (ws.code) {
			console.log(`[wss_players] Terminating client due to lobby reset (code: ${ws.code})`);
			ws.terminate();
		}
	}
}

exports.wss = wss_players;