const mongoose = require('mongoose');

const ProduitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  quantite: { type: Number, required: true },
  prixAchat: { type: Number, required: true },
  prixVente: { type: Number, required: true },
  venteParGros: { type: Boolean, default: false },
  prixVenteGros: { type: Number, default: null },
  uniteGros: { type: String, default: null },
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
