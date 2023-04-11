const axios = require("axios");

const HistoryController = require("../controllers/historyController");

const myInfo = async (req, res) => {
    try {
        const { name } = req.body;
        let result = await HistoryController.find({ name: name });

        res.send({ status: true, data: result });
    } catch (error) {
        res.send({ status: false });
    }
}

module.exports = { myInfo }