const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    id: {type: Number, required: true, unique: true},
    subject: {type: String, required: true},
    description: String,
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
})

const posts = mongoose.model('posts', PostSchema);
module.exports = posts;