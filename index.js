const PORT = 8080;
var express = require('express');
var server = express();
var jwt = require('jsonwebtoken');
// const { MongoClient } = require('mongodb');
// const client = new MongoClient(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

// async function run() {
//     await client.connect();
//     console.log('Connection Ok');
//     // const db = client.db('myTask');
//     // const collection = db.collection('doc');
//     // const insertStuff = await collection.insertMany([{a : 1}, {b : 2}, {c : 3}])
//     // console.log(`Documents insérés : ${insertStuff}`);
//     return 'done!';
// }

// run()
//   .then(console.log)
//   .catch(console.error)
//   .finally(() => client.close())

server.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

server.options('/post', function(req, res) {
    res.sendStatus(200);
})

server.post('/post', function(req, res) {
    res.send('POST request to /post');
})

server.get('/auth', function (req, res) {
});

server.get('/auth/login', function(req, res) {
    const user = { id: 3};
    const token = jwt.sign({ user }, 'my_secret_key');
    res.json({
        token: token
    });
});

server.get('/auth/protection', ensureToken, function( req, res) {
    jwt.verify(req.token, 'my_secret_key', function(err, data) {
        if(err) {
            res.sendStatus(403);
        } else {
            res.json({
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
