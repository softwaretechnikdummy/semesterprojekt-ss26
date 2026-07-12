const crypto = require("crypto");

const GameStateManager = require('@managers/GameStateManager');
const LobbyManager = require('@managers/LobbyManager');

const comm_gamemaster = require('@communication/comm_gamemaster');
const comm_players = require('@communication/comm_players');
const { link } = require("fs");

const base_model = {
    class: 'GraphLinksModel',
    nodeKeyProperty: 'uuid',
    pointsDigits: 0,
    nodeDataArray: [],
    linkDataArray: [],
    wordPool: [],
    modelHistory: []
}

var model = GameStateManager.ReadModel(base_model);

function generateCode(length = 2) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const bytes = crypto.randomBytes(length);
    
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
    
    return result;
}
function generateDigits(length = 2) {
    const chars = '123456789';
    const bytes = crypto.randomBytes(length);
    
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
    
    return result;
}

function generateRandomCode() {
    // Uppercase A-Z: 65-90 ASCII
    const letters = generateCode(2);
    // Two digits 11-99
    const digits = generateDigits(2);
    return `${letters}${digits}`;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
}

function takeRandom(arr) {
    if (arr.length === 0) return null;
  
    const index = Math.floor(Math.random() * arr.length);
    const [item] = arr.splice(index, 1);
    return item;
}

exports.UpdateModel = function(history_message) {
    if (history_message) {
        if (!model.modelHistory) model.modelHistory = [];
        model.modelHistory.push({
            time: new Date().getTime(),
            nodeDataArray: JSON.parse(JSON.stringify(model.nodeDataArray)),
            linkDataArray: JSON.parse(JSON.stringify(model.linkDataArray)),
            message: history_message
        });
    }

    GameStateManager.WriteModel(model);
    // Send model update to GameMaster
    comm_gamemaster.UpdateModel(model);
}

exports.ResetGame = function() {
    model = JSON.parse(JSON.stringify(base_model));
    LobbyManager.ResetLobby();
    exports.UpdateModel(`game reset`);
}

exports.CreatePlayerNode = function(player_name) {
    return {
        text: player_name,
        code: generateRandomCode(),
        state: "abwesend",
        kills: 0,
        redraws: 0,
        uuid: crypto.randomUUID(),
        loc: "0 0"
    };
}

exports.AddPlayer = function(data) {
    var player_node = exports.CreatePlayerNode(data.name);

    var node_before = exports.GetNodeFromUUID(data.after);
    var original_link = model.linkDataArray.find(link => { return link.from == node_before.uuid });

    if (!original_link) {
        console.log(`[GameManager::AddPlayer] original_link couldn't be found`);
        return false;
    }

    var node_after = exports.GetNodeFromUUID(original_link.to);
    if (!original_link) {
        console.log(`[GameManager::AddPlayer] node_after couldn't be found`);
        return false;
    }

    if (data.before_keeps) { // Node before keeps the word
        original_link.to = player_node.uuid;
        model.linkDataArray.push({
            from: player_node.uuid,
            to: node_after.uuid,
            word: data.word
        });
    } else {
        original_link.from = player_node.uuid;
        model.linkDataArray.push({
            from: node_before.uuid,
            to: player_node.uuid,
            word: data.word
        });
    }

    model.nodeDataArray.push(player_node);

    exports.UpdateModel(`player <span class="playerpill">${player_node.text} (${player_node.kills})</span> added with <span class="wordpill">${data.word}</span> on <span class="playerpill">${node_after.text} (${node_after.kills})</span>`);
}

exports.InitializeGame = function(player_names, words) {
    exports.ResetGame();
    for (var player_name of player_names) {
        model.nodeDataArray.push(exports.CreatePlayerNode(player_name));
    }

    shuffle(model.nodeDataArray);

    var word_count = words.length;

    model.linkDataArray = model.nodeDataArray.map((node, i) => ({
        from: node.uuid,
        to: model.nodeDataArray[(i + 1) % model.nodeDataArray.length].uuid,
        points: [],
        word: takeRandom(words)
    }));

    model.wordPool = words;

    exports.UpdateModel(`new game initialized with ${player_names.length} players and ${word_count} words`);
}

exports.UpdateWordpool = function(words) {
    model.wordPool = words;
    exports.UpdateModel(`wordpool updated with ${words.length} words`);
}

exports.Associate = function(uuid, lobby_code) {
    for (var node of model.nodeDataArray) {
        if (node.uuid == uuid) {
            for (var node_it_2 of model.nodeDataArray) {
                if (node_it_2.lobby_code == lobby_code) {
                    node_it_2.lobby_code = null;
                    node_it_2.online = false;
                    node_it_2.time_associated = 0;
                    console.log(`[GameManager::Associate] needed to disassociate lobby code ${lobby_code} from ${node_it_2.text} (${node_it_2.uuid}) first`);
                }
            }
            node.lobby_code = lobby_code;
            node.time_associated = new Date().getTime();
            node.online = LobbyManager.IsOnline(lobby_code);
            console.log(`[GameManager::Associate] successfully associated lobby code ${lobby_code} to ${node.text} (${uuid})`);
            exports.UpdateModel(`player <span class="playerpill">${node.text} (${node.kills})</span> associated with lobby code <span class="codepill">${lobby_code}</span>`);
            LobbyManager.UpdateLobby();
            comm_players.UpdateGameState(lobby_code);
            return true;
        }
    }

    return false;
}

exports.Disassociate = function(lobby_code) {
    if (!lobby_code) return false;
    for (var node of model.nodeDataArray) {
        if (node.lobby_code == lobby_code) {
            node.lobby_code = null;
            node.time_associated = 0;
            node.online = false;
            console.log(`[GameManager::Disassociate] disassociated lobby code ${lobby_code} from ${node.text} (${node.uuid})`);
            exports.UpdateModel(`disassociated <span class="playerpill">${node.text} (${node.kills})</span> from lobby code <span class="codepill">${lobby_code}</span>`);
            LobbyManager.UpdateLobby();
            comm_players.UpdateGameState(lobby_code);
            return true;
        }
    }

    return false;  
}

exports.EndGame = function() {
    console.log(`[GameManager::EndGame] broadcasting game ended`);
    model.game_is_over = true;
    comm_players.UpdateAllGameStates();
    exports.UpdateModel(`game ended`);
}

exports.ExecuteKill = function (lobby_code, target_uuid) {
    var player_node = exports.GetNodeFromCode(lobby_code);
    if (!player_node) {
        console.log(`[GameManager::ExecuteKill] player_node not found`);
        return false;
    }

    var target_node = exports.GetNodeFromUUID(target_uuid);
    if (!target_node) {
        console.log(`[GameManager::ExecuteKill] target_node not found`);
        return false;
    }

    var link = model.linkDataArray.find(link => { return link.from == player_node.uuid && link.to == target_node.uuid});
    if (!link) {
        console.log(`[GameManager::ExecuteKill] link between player_node and target_node doesn't exist`);
        return false;
    }

    var link_target_outgoing = model.linkDataArray.find(link => { return link.from == target_node.uuid});
    if (!link_target_outgoing) {
        console.log(`[GameManager::ExecuteKill] target_node doesn't have outgoing link`);
        return false;
    }

    target_node.assassinated_by = {
        uuid: player_node.uuid,
        name: player_node.text,
        word: link.word,
        time: new Date().getTime()
    };
    comm_players.UpdateGameState(target_node.lobby_code);

    player_node.kills = player_node.kills + 1;

    if (link_target_outgoing.to == player_node.uuid) {
        console.log(`[GameManager::ExecuteKill] link loop detected -> this was the LAST KILL -> the game is over!`);
        model.linkDataArray = [];
        player_node.is_last_survivor = true;
        exports.EndGame();
    } else {
        link_target_outgoing.from = player_node.uuid;
        model.linkDataArray = model.linkDataArray.filter(link => { return !(link.from == player_node.uuid && link.to == target_node.uuid)});
    }

    exports.UpdateModel(`player <span class="playerpill">${target_node.assassinated_by.name} (${player_node.kills})</span> killed <span class="playerpill">${target_node.text} (${target_node.kills})</span> with word <span class="wordpill">${target_node.assassinated_by.word}</span>`);
}

exports.ModifyPlayer = function(uuid, new_name, new_word) {
    var player_node = exports.GetNodeFromUUID(uuid);
    if (!player_node) {
        console.log(`[GameManager::ModifyPlayer] player_node not found`);
        return false;
    }
    
    var old_name = player_node.text;
    var old_word = "";
    player_node.text = new_name;

    var link_outgoing = model.linkDataArray.find(link => { return link.from == player_node.uuid});
    if (link_outgoing) {
        old_word = link_outgoing.word;
        link_outgoing.word = new_word;
    }

    comm_players.UpdateGameState(player_node.lobby_code);
    
    var log_message = `player <span class="playerpill">${old_name} (${player_node.kills})</span> updated.`;
    if (old_name != new_name) {
        log_message += ` name changed to <span class="playerpill">${new_name} (${player_node.kills})</span>.`;
    }
    if (old_word != new_word) {
        log_message += ` word changed from <span class="wordpill">${old_word}</span> to <span class="wordpill">${new_word}</span>`;
    }
    exports.UpdateModel(log_message);

    return true;
}

exports.RedrawWord = function(lobby_code) {
    var player_node = exports.GetNodeFromCode(lobby_code);
    if (!player_node) {
        console.log(`[GameManager::RedrawWord] player_node not found`);
        return false;
    }

    var link_outgoing = model.linkDataArray.find(link => { return link.from == player_node.uuid});
    if (!link_outgoing) {
        console.log(`[GameManager::RedrawWord] link_outgoing not found`);
        return false;
    }

    var old_word = link_outgoing.word;
    var new_word = takeRandom(model.wordPool);

    if (!new_word) {
        console.log(`[GameManager::RedrawWord] wordpool is empty`);
        return false;
    }

    player_node.redraws = player_node.redraws + 1;

    link_outgoing.word = new_word;
    comm_players.UpdateGameState(lobby_code);
    exports.UpdateModel(`player <span class="playerpill">${player_node.text} (${player_node.kills})</span> redrew word (<span class="wordpill">${old_word}</span> --> <span class="wordpill">${link_outgoing.word}</span>)`);

    return new_word;
}

exports.DeletePlayer = function(uuid, option) {
    var player_node = exports.GetNodeFromUUID(uuid);
    if (!player_node) {
        console.log(`[GameManager::DeletePlayer] player_node not found`);
        return false;
    }

    if (player_node.lobby_code) {
        console.log(`[GameManager::DeletePlayer] player_node is associated to lobby code`);
        return false;
    }

    var link_incoming = model.linkDataArray.find(link => { return link.to == player_node.uuid });
    if (!link_incoming) {
        console.log(`[GameManager::DeletePlayer] link_incoming not found`);
        return false;
    }
    var link_outgoing = model.linkDataArray.find(link => { return link.from == player_node.uuid });
    if (!link_outgoing) {
        console.log(`[GameManager::DeletePlayer] link_outgoing not found`);
        return false;
    }

    var node_before = model.nodeDataArray.find(node => { return node.uuid == link_incoming.from });
    if (!node_before) {
        console.log(`[GameManager::DeletePlayer] node_before not found`);
        return false;
    }
    var node_after = model.nodeDataArray.find(node => { return node.uuid == link_outgoing.to });
    if (!node_after) {
        console.log(`[GameManager::DeletePlayer] node_after not found`);
        return false;
    }

    if (option == 1) { // keep incoming word -> modify incoming link -> delete outgoing link
        link_incoming.to = node_after.uuid;
        model.linkDataArray = model.linkDataArray.filter(link => { return link.from != player_node.uuid })
    }
    else if (option == 2) { // keep outgoing word -> modify outgoing link -> delete incoming link
        link_outgoing.from = node_before.uuid;
        model.linkDataArray = model.linkDataArray.filter(link => { return link.to != player_node.uuid })
    }

    model.nodeDataArray = model.nodeDataArray.filter(node => { return node.uuid != player_node.uuid });

    if (model.linkDataArray.length == 1) {
        var node_last_player = model.nodeDataArray.find(node => { return node.uuid == model.linkDataArray[0].from });
        if (node_last_player)
            node_last_player.is_last_survivor = true;

        model.linkDataArray = [];

        console.log(`[GameManager::DeletePlayer] only one alive player left after deletion -> ending game`);
        exports.UpdateModel(`player <span class="playerpill">${player_node.text} (${player_node.kills})</span> deleted -> only one alive player left -> ending game`);
        exports.EndGame();
    }

    if (node_before.lobby_code) comm_players.UpdateGameState(node_before.lobby_code);
    exports.UpdateModel(`player <span class="playerpill">${player_node.text} (${player_node.kills})</span> deleted`);

    return true;
}

exports.GetNodeFromCode = function(lobby_code) {
    if (!lobby_code) return null;
    return model.nodeDataArray.find(node => { return node.lobby_code == lobby_code });
}

exports.GetNodeFromUUID = function(uuid) {
    if (!uuid) return null;
    return model.nodeDataArray.find(node => { return node.uuid == uuid });
}

exports.GetPlayerGameState = function(lobby_code) {
    var player_node = exports.GetNodeFromCode(lobby_code);
    if (!player_node) return null;
    
    var link_outgoing = model.linkDataArray.find(link => { return link.from == player_node.uuid });
    var target_node = null;
    if (link_outgoing) target_node = model.nodeDataArray.find(node => { return node.uuid == link_outgoing.to });

    return {
        name: player_node.text,
        code: player_node.code,
        kills: player_node.kills,
        target: target_node ? {
            uuid: target_node.uuid,
            name: target_node.text
        } : null,
        word: link_outgoing ? link_outgoing.word : null,
        redraws: player_node.redraws ?? 0,
        time_associated: player_node.time_associated,
        assassinated_by: player_node.assassinated_by ?? null,
        game_is_over: model.game_is_over ?? false,
        is_last_survivor: player_node.is_last_survivor ?? false
    }
}

exports.SetPlayerOnline = function(lobby_code, online) {
    if (!lobby_code) return false;
    for (var node of model.nodeDataArray) {
        if (node.lobby_code == lobby_code) {
            node.online = online;
            exports.UpdateModel();
            return true;
        }
    }

    return false;
}

exports.GetModel = function() {
    return model;
}