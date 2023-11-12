const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const user = require('./models/User');
const posts = require('./models/Post');
const secretKey = 'homerowasdfghjklasdfghjklasdghjklasdghjalsdglaksjgaskldfhasdgjkasdlk';

// authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
}

// login and register routes
router.post('/login', authenticateToken, async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await user.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, secretKey);
        res.status(200).json({ token });

    }
    catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.post('/register', authenticateToken, async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await user.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashpass = await bcrypt.hash(password, 10);
        const newUser = new user({
            username,
            password: hashpass,
            isAdmin: false
        });

        console.log(user);
        await newUser.save();
        const token = jwt.sign({ id: newUser.id, username: newUser.username }, secretKey);
        res.status(201).json({ token });

        res.status(201).json({ message: 'User registered successfully', token });
    }
    catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// crud operation routes for posts

// get all posts
router.get('/posts', async (req, res) => {
    try {
        const allPosts = await posts.find();
        res.status(200).json(allPosts);
    }
    catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
// get specific post by id
router.get('/posts/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await posts.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json(post);
    }
    catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
// get specific post by subject
router.get('/posts/:subject', async (req, res) => {
    try {
        const postsubject = req.params.subject;
        const post = await posts.findOne({ subject: postsubject }).populate('user', 'username');

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json(post);
    }
    catch (error) {
        console.error('Error fetching post by subject:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.post('/posts', async (req, res) => {
    try {
        const { subject, description } = req.body;
        const userId = req.user._id;
        const newPost = new posts({
            subject,
            description,
            user: userId
        });

        await newPost.save();
        await user.findByIdAndUpdate(userId, { $push: { posts: newPost._id } });

        res.status(201).json({ message: 'Post created successfully', newPost });
    }
    catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.put('/posts/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const { subject, description } = req.body;

        const updatedPost = await posts.findByIdAndUpdate(postId, { subject, description }, { new: true });

        if (!updatedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json({ message: 'Post updated successfully', updatedPost });
    }
    catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.delete('/posts/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id;

        const deletedPost = await posts.findByIdAndRemove(postId);

        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }
        await user.findByIdAndUpdate(userId, { $pull: { posts: postId } });

        res.status(200).json({ message: 'Post deleted successfully', deletedPost });
    }
    catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// these are admin specific routes
router.get('/users', async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Admin access only' });
        }

        const allUsers = await user.find({}, { password: 0 });

        res.status(200).json(allUsers);
    }
    catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// disabling and blocking users and posts
router.put('/users/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Admin access only' });
        }
        await user.findByIdAndUpdate(userId, { isDisabled: true });

        res.status(200).json({ message: 'User disabled successfully' });
    }
    catch (error) {
        console.error('Error disabling user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.delete('/users/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Admin access only' });
        }

        await user.findByIdAndRemove(userId);

        res.status(200).json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.delete('/posts/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Admin access only' });
        }

        await posts.findOneAndRemove({ id: postId });

        res.status(200).json({ message: 'Post deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;