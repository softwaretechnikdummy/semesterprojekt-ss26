const crypto = require('crypto');

const GameManager = require('@managers/GameManager');
const GameStateManager = require('@managers/GameStateManager');
const comm_gamemaster = require('@communication/comm_gamemaster');
const comm_players = require('@communication/comm_players');

function generateCode(length = 4) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = crypto.randomBytes(length);
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  
  return result;
}

var lobby = GameStateManager.ReadLobby();

exports.UpdateLobby = function() {
    GameStateManager.WriteLobby(lobby);
    // Send lobby update to GameMaster
    comm_gamemaster.UpdateLobby(lobby);
}

exports.Register = function() {
    var code = null;
    while(!code|| lobby.hasOwnProperty(code)) {
        code = generateCode();
    }

    lobby[code] = { 
        uuid: null,
        online: false,
        registered: Date.now()
    };

    exports.UpdateLobby();

    return code;
}

exports.IsRegistered = function(code) {
    return lobby.hasOwnProperty(code);
}

exports.IsOnline = function(code) {
    return lobby[code].online;
}

exports.SetOnline = function(code, online) {
    if (lobby[code]) {
        lobby[code].online = online;
    }
    GameManager.SetPlayerOnline(code, online);
    exports.UpdateLobby();
}

exports.GetLobby = function() {
    return lobby;
}

exports.ResetLobby = function() {
    lobby = {};
    comm_players.Reset();
    exports.UpdateLobby();
}

exports.RunCodeHouseKeeping = function () {
    var lobby_new = {};
    var modified = false;
    for (var code in lobby) {
        if (lobby[code].online || (Date.now() - lobby[code].registered < 60*60*1000) || GameManager.GetNodeFromCode(code)) {
            lobby_new[code] = lobby[code];
        } else {
            console.log(`[LobbyManager::RunCodeHoueKeeping] deleted stale code ${code}`);
        }
    }
    lobby = lobby_new;
    exports.UpdateLobby();
}

const HOUSEKEEPING_INTERVAL = 30_000;

const interval = setInterval(() => {
  exports.RunCodeHouseKeeping();
}, HOUSEKEEPING_INTERVAL);