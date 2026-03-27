const router = require('express').Router();
const Categorie = require('../../models/Categorie');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Dossier uploads créé pour catégories');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// GET all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Categorie.find();
    res.status(200).json({ status: 'ok', categories });
  } catch (err) {
    console.error('Erreur categories:', err);
    res.status(500).json({ status: 'error', msg: 'Erreur serveur' });
  }
});

// POST create category (image possible)
router.post('/add', upload.single('image'), async (req, res) => {
  const { nom, description } = req.body;
  if (!nom) return res.status(400).json({ status: 'notok', msg: 'Nom de catégorie requis' });

  const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;
  const categoryData = { nom, description };
  if (imagePath) categoryData.image = imagePath;

  try {
    const category = new Categorie(categoryData);
    await category.save();
    res.status(201).json({ status: 'ok', categorie: category });
  } catch (err) {
    console.error('Erreur création catégorie:', err);
    if (err.code === 11000) {
      return res.status(400).json({ status: 'notok', msg: 'Catégorie déjà existante' });
    }
    res.status(500).json({ status: 'error', msg: 'Erreur serveur' });
  }
});

// PUT update category
router.put('/update/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { nom, description } = req.body;

  if (!nom) return res.status(400).json({ status: 'notok', msg: 'Nom de catégorie requis' });

  try {
    const category = await Categorie.findById(id);
    if (!category) {
      return res.status(404).json({ status: 'notok', msg: 'Catégorie non trouvée' });
    }

    // Si une nouvelle image est fournie, supprimer l'ancienne
    if (req.file) {
      if (category.image) {
        const oldImagePath = path.join(__dirname, '../../', category.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      category.image = `/uploads/${req.file.filename}`;
    }

    category.nom = nom;
    category.description = description;

    await category.save();
    res.status(200).json({ status: 'ok', categorie: category });
  } catch (err) {
    console.error('Erreur mise à jour catégorie:', err);
    if (err.code === 11000) {
      return res.status(400).json({ status: 'notok', msg: 'Catégorie déjà existante' });
    }
    res.status(500).json({ status: 'error', msg: 'Erreur serveur' });
  }
});

module.exports = router;
