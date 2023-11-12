const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const fileuploader = require('express-fileupload');
const routes = require('./routes')
const port = 3000;
const app = express();

app.use(bodyparser.json());
app.use(fileuploader());

mongoose.connect('mongodb://127.0.0.1:27017', {useNewURLParser: true, useUnifiedTopology: true });
const database = mongoose.connection;
database.on('error', console.error.bind(console, 'Error'));
database.once('open', function() {
    console.log('Success')
})

app.use('/', routes);

app.listen(port, () => {
    console.log(">server listens on port: 3000");
})