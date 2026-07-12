const ws = require('ws');

const GameManager = require('@managers/GameManager');
const LobbyManager = require('@managers/LobbyManager');

const wss_gamemaster = new ws.WebSocketServer({ noServer: true });
wss_gamemaster.on('connection', (ws, req) => {
	console.log('[wss_gamemaster] WebSocket client connected');
  
	ws.send(JSON.stringify({
		type: 'model_update',
		data: GameManager.GetModel()
	}));  
	ws.send(JSON.stringify({
		type: 'lobby_update',
		data: LobbyManager.GetLobby()
	}));
  
	ws.on('message', (data) => {
		const message_str = data.toString();
		const message = JSON.parse(message_str);
		if (message.type == 'game_create_new') {
			GameManager.InitializeGame(message.data.players, message.data.words);
		}
        if (message.type == 'game_end') {
            GameManager.EndGame();
        }
        if (message.type == 'wordpool_update') {
			GameManager.UpdateWordpool(message.data);
		}
        if (message.type == 'lobby_associate') {
            GameManager.Associate(message.data.uuid, message.data.code);
        }
        if (message.type == 'lobby_disassociate') {
            GameManager.Disassociate(message.data.code);
        }
        if (message.type == 'game_addplayer') {
            GameManager.AddPlayer(message.data);
        }
        if (message.type == 'player_modify') {
            if(GameManager.ModifyPlayer(message.data.uuid, message.data.new_name, message.data.new_word)) {
                exports.BroadCast(message);
            }
        }
        if (message.type == 'player_delete') {
            GameManager.DeletePlayer(message.data.uuid, message.data.option);
        }
	});
  
	ws.on('close', () => {
	  console.log('[wss_gamemaster] WebSocket client disconnected');
	});
});

exports.UpdateLobby = function(lobby) {
    for (const ws of wss_gamemaster.clients) {
        if (ws.readyState !== ws.OPEN) continue;
        ws.send(JSON.stringify({
            type: 'lobby_update',
            data: lobby
        }))
    }
}

exports.UpdateModel = function(model) {
    for (const ws of wss_gamemaster.clients) {
        if (ws.readyState !== ws.OPEN) continue;
        ws.send(JSON.stringify({
            type: 'model_update',
            data: model
        }))
    }
}

exports.BroadCast = function(message) {
    for (const ws of wss_gamemaster.clients) {
        if (ws.readyState !== ws.OPEN) continue;
        ws.send(JSON.stringify(message))
    } 
}

exports.wss = wss_gamemaster;