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

// server.options('/post', function(req, res) {
//   res.sendStatus(200);
// })

// server.options('/user/me', function(req, res) {
//   res.sendStatus(200);
// })

// server.post('/post', function(req, res) {
//   res.send('POST request to /post');
// })

server.post('/auth/register', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Un utilisateur avec cette adresse e-mail existe déjà' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName
    });

    await newUser.save();
    const token = jwt.sign({ userId: newUser._id }, 'votre-secret-jwt', { expiresIn: '24h' });

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

// server.get('/auth', function (req, res) {
// });

server.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Adresse e-mail ou mot de passe incorrect' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Adresse e-mail ou mot de passe incorrect' });
    }

    const token = jwt.sign({ userId: user._id }, 'votre-secret-jwt', { expiresIn: '24h' });
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

// server.get('/auth/protection', ensureToken, function( req, res) {
//     jwt.verify(req.token, 'my_secret_key', function(err, data) {
//         if(err) {
//             res.sendStatus(403);
//         } else {
//             res.json({
//                 data: data
//             });
//         }
//     });
// });

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

server.get('/user/me', ensureToken, async (req, res) => {
  try {
    jwt.verify(req.token, 'votre-secret-jwt', async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Mauvais token JWT' });
      }
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(500).json({ message: 'Utilisateur introuvable' });
      }
      res.status(200).json({
        ok: true,
        data: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des informations utilisateur' });
  }
});

server.put('/user/edit', ensureToken, async (req, res) => {
  try {
    jwt.verify(req.token, 'votre-secret-jwt', async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Mauvais token JWT' });
      }
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(500).json({ message: 'Utilisateur introuvable' });
      }

      if (req.body.firstName) {
        user.firstName = req.body.firstName;
      }
      if (req.body.lastName) {
        user.lastName = req.body.lastName;
      }
      if (req.body.email) {
        user.email = req.body.email;
      }
      if (req.body.password) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        user.password = hashedPassword;
      }
      await user.save();

      res.status(200).json({
        ok: true,
        data: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour des informations utilisateur' });
  }
});

server.delete('/user/remove', ensureToken, async (req, res) => {
  try {
    jwt.verify(req.token, 'votre-secret-jwt', async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Mauvais token JWT' });
      }
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      await User.findByIdAndDelete(decoded.userId);

      res.status(200).json({
        ok: true,
        data: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          removed: true
        }
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la suppresion du compte' });
  }
});

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  upVotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {collection: 'posts'});

const Post = mongoose.model('Post', postSchema);

server.get('/post', ensureToken, async (req, res) => {
  try {
    jwt.verify(req.token, 'votre-secret-jwt', async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Mauvais token JWT' });
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      const posts = await Post.find({});

      res.status(200).json({
        ok: true,
        data: posts
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la liste des éléments' });
  }
});

server.post('/post', ensureToken, async (req, res) => {
  try {
    jwt.verify(req.token, 'votre-secret-jwt', async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Mauvais token JWT' });
      }

      const { title, content } = req.body;
      const user = await User.findById(decoded.userId);
      const newPost = new Post({
        userId: user._id,
        title: title,
        content: content,
        createdAt: new Date(),
        comments: [],
        upVotes: []
      });

      await newPost.save();

      res.status(201).json({
        ok: true,
        data: {
          _id: newPost._id,
          createdAt: newPost.createdAt,
          userId: user._id,
          firstName: user.firstName,
          title: newPost.title,
          content: newPost.content,
          comments: newPost.comments,
          upVotes: newPost.upVotes
        }
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création du post' });
  }
});

server.listen(PORT, function() {
    console.log(`working on http://localhost:${PORT}`)
});
