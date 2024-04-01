const PORT = 8080;
var express = require('express');
var server = express();
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://kanoisecouchoud:EqBTC2z6ZDHEMf2g@keduback.omperqd.mongodb.net/";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        // Se connecter au serveur MongoDB
        await client.connect();

        // Sélectionner la base de données
        const database = client.db("KEDUBACK");

        // Votre code ici pour interagir avec la base de données...

    } finally {
        // Assurez-vous de fermer la connexion lorsque vous avez fini
        await client.close();
    }
}

run().catch(console.dir);

server.get('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send('<h1>Bonjour sur mon serveur !</h1>');
});

server.listen(PORT, function() {
    console.log(`working on http://localhost:${PORT}`)
});

//mongodb+srv://kanoisecouchoud:<password>@keduback.omperqd.mongodb.net/