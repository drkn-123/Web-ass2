const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const funnykey = 'homerowasdfghjklasdfghjklasdghjklasdghjalsdglaksjgaskldfhasdgjkasdlk';

const UserSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    isAdmin: {type: Boolean, default: false},
    isDisabled: {type: Boolean, default: false},
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
})

UserSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id, isAdmin: this.isAdmin, isDisabled: this.isDisabled }, funnykey);
    return token;
};

const user = mongoose.model('user', UserSchema);
module.exports = user;