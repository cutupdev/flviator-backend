var History = require("../models/historyModel");
var crypto = require('crypto');

var HistoryController = {
    create: function (props) {
        const newHistory = new History(props);
        newHistory.save();
    },
    update: function (req, res) {

    },
    find: async (props) => {
        try {
            var result = await History.find(props);
            return result;
        } catch (error) {
            console.log(error.message, "Hello");
        }
    }
}

module.exports = HistoryController;