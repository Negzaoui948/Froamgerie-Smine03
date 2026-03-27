const mongoose = require('mongoose');

// Définir le schéma utilisateur
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true   // L'email doit être unique
  },

  password: {
    type: String,
    required: true  // Le mot de passe est requis
  },

  role: {
    type: String,
    default: "user"  // valeur par défaut
  }
});

// Créer un modèle basé sur ce schéma
const User = mongoose.model('User', UserSchema);

module.exports = User;
