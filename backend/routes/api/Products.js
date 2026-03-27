const router = require("express").Router();
const Produit = require("../../models/Product"); // Chemin vers votre modèle
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Dossier uploads créé');
}

// Configuration multer pour les images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Utiliser le chemin absolu
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nom unique
  }
});

const upload = multer({ storage: storage });


// --- CRÉER (Ajouter) ---
// @route   POST api/produits/add
router.post("/add", upload.array('images', 10), async (req, res) => {
  const { name, quantite, prixAchat, prixVente, unite, categorie } = req.body;

  if (!name || quantite == null || prixAchat == null || prixVente == null || !unite || !categorie) {
    return res.status(400).json({
      status: "notok",
      msg: "Veuillez renseigner tous les champs requis (name, quantite, prixAchat, prixVente, unite, categorie)",
    });
  }

  try {
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    const newProduit = new Produit({
      name,
      quantite: Number(quantite),
      prixAchat: Number(prixAchat),
      prixVente: Number(prixVente),
      unite,
      categorie,
      images,
    });
    const savedProduit = await newProduit.save();

    res.status(201).json({
      status: "ok",
      msg: "Produit ajouté avec succès",
      produit: savedProduit,
    });
  } catch (err) {
    res.status(500).json({ status: "error", msg: "Erreur lors de l'ajout" });
  }
});

// --- LIRE (Récupérer tout) ---
// @route   GET api/produits/
router.get("/", async (req, res) => {
  try {
    const produits = await Produit.find().populate('categorie', 'nom');
    res.status(200).json({
      status: "ok",
      produits,
    });
  } catch (err) {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// --- LIRE TOUS LES PRODUITS POUR LES DIAGRAMMES ---
// @route   GET api/produits/allProducts
router.get("/allProducts", async (req, res) => {
  try {
    const produits = await Produit.find().populate('categorie', 'nom');
    const data = produits.map(p => ({
      libelle: p.name,
      quantite: p.quantite,
      unite: p.unite,
      categorie: p.categorie ? p.categorie.nom : null
    }));
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// --- MODIFIER ---
// @route   PUT api/produits/update/:id
router.put("/update/:id", upload.array('images', 10), async (req, res) => {
  try {
    const { name, quantite, prixAchat, prixVente, unite, categorie } = req.body;
    const updateData = {
      ...(name !== undefined && { name }),
      ...(quantite !== undefined && { quantite: Number(quantite) }),
      ...(prixAchat !== undefined && { prixAchat: Number(prixAchat) }),
      ...(prixVente !== undefined && { prixVente: Number(prixVente) }),
      ...(unite !== undefined && { unite }),
      ...(categorie !== undefined && { categorie }),
    };

    // Récupérer le produit existant pour conserver les anciennes images si nécessaire
    const existingProduit = await Produit.findById(req.params.id);
    if (!existingProduit) {
      return res.status(404).json({ status: "notok", msg: "Produit non trouvé" });
    }

    // Si de nouvelles images sont envoyées, les remplacer
    if (req.files && req.files.length > 0) {
      console.log(`Fichiers reçus: ${req.files.length}`);
      updateData.images = req.files.map(file => `/uploads/${file.filename}`);
      console.log("Nouvelles images:", updateData.images);
    } else {
      // Sinon, conserver les anciennes images
      updateData.images = existingProduit.images || [];
    }

    const updatedProduit = await Produit.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true } // Pour renvoyer le document modifié
    );

    if (!updatedProduit) {
      return res.status(404).json({ status: "notok", msg: "Produit non trouvé" });
    }

    res.status(200).json({
      status: "ok",
      msg: "Produit modifié avec succès",
      produit: updatedProduit,
    });
  } catch (err) {
    res.status(500).json({ status: "error", msg: "Erreur lors de la modification" });
  }
});

// --- SUPPRIMER ---
// @route   DELETE api/produits/delete/:id
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedProduit = await Produit.findByIdAndDelete(req.params.id);

    if (!deletedProduit) {
      return res.status(404).json({ status: "notok", msg: "Produit non trouvé" });
    }

    res.status(200).json({
      status: "ok",
      msg: "Produit supprimé avec succès",
    });
  } catch (err) {
    res.status(500).json({ status: "error", msg: "Erreur lors de la suppression" });
  }
});

module.exports = router;