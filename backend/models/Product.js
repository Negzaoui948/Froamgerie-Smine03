const mongoose = require('mongoose');

const ProduitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantite: { type: Number, required: true },
  prixAchat: { type: Number, required: true },
  prixVente: { type: Number, required: true },
  unite: { 
    type: String, 
    enum: ['kg', 'litre', 'piece', 'carton'], 
    required: true 
  },
  
  // Liaison vers la catégorie
  categorie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categorie',
    required: true
  },

  images: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Produit', ProduitSchema);