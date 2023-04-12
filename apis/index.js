const History = require("./history");

const API = (router) => {
    router.post('/myInfo', History.myInfo);
    router.post('/topHistory', History.topHistory);
    router.get('/getTotalHistory', History.totalHistory);
    router.get('/getTotalUsers', History.totalUsers);
}

module.exports = API;