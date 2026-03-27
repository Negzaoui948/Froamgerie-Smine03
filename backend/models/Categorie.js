const mongoose = require('mongoose');

const CategorieSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, "Le nom de la catégorie est obligatoire"],
    unique: true,
    trim: true
  },
  
  // Nouvelle description pour la catégorie
  description: {
    type: String,
    required: false,
    trim: true
  },

  // Image représentative de la catégorie (URL ou chemin du fichier)
  image: {
    type: String,
    required: false,
    default: "https://via.placeholder.com/150" // Image par défaut si vide
  }
}, { timestamps: true });

module.exports = mongoose.model('Categorie', CategorieSchema);