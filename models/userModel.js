var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    name: {
        type: String
    },
    balance: {
        type: Number
    }
})

var User;
if (mongoose.models.User)
    User = mongoose.model('User');
else
    User = mongoose.model('User', UserSchema);

module.exports = User;