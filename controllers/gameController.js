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
        const { filter, opt } = props;
        await User.updateOne(filter, { $set: opt });
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