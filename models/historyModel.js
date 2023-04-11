var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var HistorySchema = new Schema({
    name: {
        type: String
    },
    betAmount: {
        type: Number
    },
    cashoutAt: {
        type: Number
    },
    cashouted: {
        type: Boolean
    },
    date: {
        type: Date
    }
})

var History;
if (mongoose.models.History)
    History = mongoose.model('History');
else
    History = mongoose.model('History', HistorySchema);

module.exports = History;