var Game = require("../models/gameInfo");

var GameController = {
    create: function (props) {
        try {
            const newGameInfo = new Game(props);
            newGameInfo.save();
        } catch {

        }
    },
    update: async (props) => {
        try {
            const { opt } = props;
            const gameInfo = await Game.find();
            await Game.updateOne({ _id: gameInfo[0]._id }, { $set: opt });
        } catch (err) {
            console.log(err.message);
        }
    },
    find: async (props) => {
        try {
            var result = await Game.find(props);
            return result;
        } catch (error) {
            console.log(error.message, "Hello");
        }
    }
}

module.exports = GameController;