var History = require("../models/historyModel");

var HistoryController = {
    create: function (props) {
        const newHistory = new History(props);
        newHistory.save();
    },
    update: async (req, res) => {
        const { filter, opt } = props;
        await History.updateOne(filter, { $set: opt });

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