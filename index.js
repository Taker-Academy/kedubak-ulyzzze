const PORT = 8080;
var express = require('express');
var server = express();
var jwt = require('jsonwebtoken');
// const { MongoClient } = require('mongodb');
// const client = new MongoClient(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

server.get('/user', function (req, res) {
    res.json({
        text: 'my api'
    });
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send('<h1>Bonjour sur mon serveur !</h1>');
});

server.get('/user/login', function( req, res) {
    const user = { id: 3};
    const token = jwt.sign({ user }, 'my_secret_key');
    res.json({
        token: token
    });
});

server.get('/user/protection', ensureToken, function( req, res) {
    jwt.verify(req.token, 'my_secret_key', function(err, data) {
        if(err) {
            res.sendStatus(403);
        } else {
            res.json({
                text: 'this is a protection',
                data: data
            });
        }
    });
});

function ensureToken(req, res, next) {
    const bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined'){
        const bearer = bearerHeader.split(" ");
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else{
        res.sendStatus(403);
    }
}

server.listen(PORT, function() {
    console.log(`working on http://localhost:${PORT}`)
});
