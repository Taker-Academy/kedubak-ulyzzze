const PORT = 8080;
const express = require('express');
const server = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL;

server.use(express.json());

server.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

server.options('/post', function(req, res) {
    res.sendStatus(200);
})

server.options('/user/me', function(req, res) {
    res.sendStatus(200);
})

server.post('/post', function(req, res) {
    res.send('POST request to /post');
})

// Connexion à la base de données MongoDB
mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erreur de connexion à MongoDB :'));
db.once('open', () => {
  console.log('Connecté à MongoDB');
});

// Schéma et modèle d'utilisateur
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true }
}, {collection: 'users'});

const User = mongoose.model('create_user', userSchema);

server.post('/auth/register', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Un utilisateur avec cette adresse e-mail existe déjà' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel utilisateur
    const newUser = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName
    });

    // Enregistrer l'utilisateur dans la base de données
    await newUser.save();

    // Générer un token JWT
    const token = jwt.sign({ userId: newUser._id }, 'votre-secret-jwt', { expiresIn: '24h' });

    // Répondre avec le token
    res.status(201).json({
        ok: true,
        data: {
          token,
          user: {
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName
          }
        }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Erreur lors de la création de l\'utilisateur' });
  }
});

server.get('/auth', function (req, res) {
});

server.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Recherche de l'utilisateur dans la base de données
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Adresse e-mail ou mot de passe incorrect' });
    }

    // Vérification du mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Adresse e-mail ou mot de passe incorrect' });
    }

    // Génération du token JWT
    const token = jwt.sign({ userId: user._id }, 'votre-secret-jwt', { expiresIn: '24h' });

    // Répondre avec le token et les informations de l'utilisateur
    res.status(200).json({
      ok: true,
      data: {
        token,
        user: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la tentative de connexion' });
  }
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
