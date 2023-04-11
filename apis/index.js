const History = require("./history");

const API = (router) => {
    router.post('/myInfo', History.myInfo);
}

module.exports = API;