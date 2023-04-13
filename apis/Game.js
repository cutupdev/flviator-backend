const GameController = require("../controllers/gameController");

const getGameInfo = async (req, res) => {
    try {
        let result = await GameController.find();

        res.send({ status: true, data: result });
    } catch (error) {
        res.send({ status: false });
    }
}

const updateGameInfo = async (req, res) => {
    try {
        await GameController.update(req.body);
        res.send({ status: true });
    } catch {
        res.send({ status: false });
    }
}

module.exports = { getGameInfo, updateGameInfo }