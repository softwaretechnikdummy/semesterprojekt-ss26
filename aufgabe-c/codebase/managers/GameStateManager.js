const fs = require('fs');

exports.ReadModel = function(base_model) {
    var model = JSON.parse(fs.readFileSync('./data/gamestate_model.json'));

    if (Object.keys(model).length == 0) {
        model = JSON.parse(JSON.stringify(base_model));
        exports.WriteModel(model);
    } else {
        for (var node of model.nodeDataArray) {
            node.online = false;
        }
    }

    return model;
}

exports.WriteModel = function(model) {
    fs.writeFileSync('./data/gamestate_model.json', JSON.stringify(model, null, '\t'));
}

exports.ReadLobby = function() {
    var lobby = JSON.parse(fs.readFileSync('./data/gamestate_lobby.json'));
    for (var lobby_entry in lobby) {
        lobby[lobby_entry].online = false;
    }
    console.log(lobby)
    return lobby;
}

exports.WriteLobby = function(lobby) {
    fs.writeFileSync('./data/gamestate_lobby.json', JSON.stringify(lobby, null, '\t'));
}