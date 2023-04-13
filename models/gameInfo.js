var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GameSchema = new Schema({
    minBetAmount: {
        type: Number
    },
    maxBetAmount: {
        type: Number
    }
})

var Game;
if (mongoose.models.game)
    Game = mongoose.model('game');
else
    Game = mongoose.model('game', GameSchema);

module.exports = Game;