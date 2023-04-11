var User = require("../models/userModel");
var crypto = require('crypto');

var UserController = {
    create: function (props) {
        try {
            const newUser = new User(props);
            const result = newUser.save();
        } catch {

        }
    },
    update: async (props) => {
        const { filter, opt } = props;
        await User.updateOne(filter, { $set: opt });
    },
    find: async (props) => {
        try {
            var result = await User.find(props);
            return result;
        } catch (error) {
            console.log(error.message, "Hello");
        }
    }
}

module.exports = UserController;