const History = require("./history");
const GameInfo = require("./Game");

const API = (router) => {
    router.post('/myInfo', History.myInfo);
    router.post('/topHistory', History.topHistory);
    router.get('/getTotalHistory', History.totalHistory);
    router.get('/getTotalUsers', History.totalUsers);
    router.get('/getGameInfo', GameInfo.getGameInfo);
    router.post("/updateGameInfo", GameInfo.updateGameInfo);
}

module.exports = API;