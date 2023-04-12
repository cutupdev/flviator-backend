const History = require("./history");

const API = (router) => {
    router.post('/myInfo', History.myInfo);
    router.post('/topHistory', History.topHistory);
    router.post('/getTotalHistory', History.totalHistory);
}

module.exports = API;