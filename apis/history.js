const axios = require("axios");

const HistoryController = require("../controllers/historyController");
const UserController = require("../controllers/userController");

const myInfo = async (req, res) => {
    try {
        const { name } = req.body;
        let result = await HistoryController.find({ name: name });

        res.send({ status: true, data: result });
    } catch (error) {
        res.send({ status: false });
    }
}

const topHistory = async (req, res) => {
    try {
        let to = Date.now();
        const current = new Date(to);
        current.setMonth(current.getMonth - 1);
        const from = current.toISOString();
    } catch {

    }
}

const totalHistory = async (req, res) => {
    let result = await HistoryController.find();
    res.send({ data: result });
}

const totalUsers = async (req, res) => {
    let result = await UserController.find();
    res.send({ users: result });
}

module.exports = { myInfo, topHistory, totalHistory, totalUsers }