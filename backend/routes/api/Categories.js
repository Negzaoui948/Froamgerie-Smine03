const router = require("express").Router();
const Categorie = require("../../models/Categorie");
const multer = require("multer");
const { uploadBuffer, destroyImage } = require("../../utils/cloudinary");

const upload = multer({ storage: multer.memoryStorage() });
const IS_VERCEL = Boolean(process.env.VERCEL);

router.get("/", async (req, res) => {
  try {
    const categories = await Categorie.find();
    res.status(200).json({ status: "ok", categories });
  } catch (err) {
    console.error("Erreur categories:", err);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

router.post("/add", upload.single("image"), async (req, res) => {
  const { nom, description } = req.body;

  if (!nom) {
    return res.status(400).json({ status: "notok", msg: "Nom de categorie requis" });
  }

  try {
    const categoryData = { nom, description };

    console.log("[POST /categories/add]", {
      "nom": nom,
      "description": description,
      "req.file exists": !!req.file,
      "req.file.originalname": req.file?.originalname,
      "req.file.size": req.file?.size,
      "CLOUDINARY_CLOUD_NAME": process.env.CLOUDINARY_CLOUD_NAME ? "✓" : "✗",
      "CLOUDINARY_API_KEY": process.env.CLOUDINARY_API_KEY ? "✓" : "✗",
      "CLOUDINARY_API_SECRET": process.env.CLOUDINARY_API_SECRET ? "✓" : "✗"
    });

    const cloudinaryReady =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (req.file) {
      if (!cloudinaryReady) {
        if (IS_VERCEL) {
          return res.status(500).json({
            status: "error",
            msg: "Upload d'image impossible: Cloudinary n'est pas configuré (obligatoire sur Vercel)."
          });
        }

        console.warn("⚠️ Cloudinary non configuré, catégorie créée sans image");
      } else {
        try {
          console.log("[Cloudinary] Démarrage upload...");
          const uploadedImage = await uploadBuffer(req.file.buffer, "fromagerie-smine/categories");
          console.log("[Cloudinary] Réponse reçue:", {
            "has secure_url": !!uploadedImage?.secure_url,
            "secure_url": uploadedImage?.secure_url,
            "keys": Object.keys(uploadedImage || {})
          });
          
          if (!uploadedImage || !uploadedImage.secure_url) {
            throw new Error("Réponse Cloudinary invalide: " + JSON.stringify(uploadedImage));
          }
          categoryData.image = uploadedImage.secure_url;
          console.log("[Cloudinary] ✓ Image enregistrée:", categoryData.image);
        } catch (uploadError) {
          console.error("❌ Erreur upload image categorie:", uploadError.message);
          console.error("Stack:", uploadError.stack);
          return res.status(502).json({ status: "error", msg: "Erreur upload image: " + uploadError.message });
        }
      }
    } else {
      console.log("ℹ️ Pas de fichier image reçu");
    }

    const category = new Categorie(categoryData);
    await category.save();

    res.status(201).json({ status: "ok", categorie: category });
  } catch (err) {
    console.error("❌ Erreur creation categorie:", err);
    if (err.code === 11000) {
      return res.status(400).json({ status: "notok", msg: "Categorie deja existante" });
    }

    res.status(500).json({
      status: "error",
      msg: "Erreur serveur lors de la création de catégorie",
      error: err.message,
      details: err.stack
    });
  }
});

router.put("/update/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { nom, description } = req.body;

  if (!nom) {
    return res.status(400).json({ status: "notok", msg: "Nom de categorie requis" });
  }

  try {
    const category = await Categorie.findById(id);

    if (!category) {
      return res.status(404).json({ status: "notok", msg: "Categorie non trouvee" });
    }

    const cloudinaryReady =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (req.file) {
      if (!cloudinaryReady) {
        if (IS_VERCEL) {
          return res.status(500).json({
            status: "error",
            msg: "Upload d'image impossible: Cloudinary n'est pas configuré (obligatoire sur Vercel)."
          });
        }

        console.warn("⚠️ Cloudinary non configuré, catégorie mise à jour sans nouvelle image");
      } else {
        if (category.image && !category.image.includes("placeholder")) {
          console.log("[Cloudinary] Suppression image précédente...");
          await destroyImage(category.image);
        }

        try {
          console.log("[Cloudinary] Démarrage upload...");
          const uploadedImage = await uploadBuffer(req.file.buffer, "fromagerie-smine/categories");
          console.log("[Cloudinary] Réponse reçue:", {
            "has secure_url": !!uploadedImage?.secure_url,
            "secure_url": uploadedImage?.secure_url,
            "keys": Object.keys(uploadedImage || {})
          });
          
          if (!uploadedImage || !uploadedImage.secure_url) {
            throw new Error("Réponse Cloudinary invalide: " + JSON.stringify(uploadedImage));
          }
          category.image = uploadedImage.secure_url;
          console.log("[Cloudinary] ✓ Image enregistrée:", category.image);
        } catch (uploadError) {
          console.error("❌ Erreur upload image categorie:", uploadError.message);
          console.error("Stack:", uploadError.stack);
          return res.status(502).json({ status: "error", msg: "Erreur upload image: " + uploadError.message });
        }
      }
    }

    category.nom = nom;
    category.description = description;

    await category.save();
    res.status(200).json({ status: "ok", categorie: category });
  } catch (err) {
    console.error("Erreur mise a jour categorie:", err);
    if (err.code === 11000) {
      return res.status(400).json({ status: "notok", msg: "Categorie deja existante" });
    }

    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const category = await Categorie.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ status: "notok", msg: "Categorie non trouvee" });
    }

    if (category.image) {
      await destroyImage(category.image);
    }

    res.status(200).json({ status: "ok", msg: "Categorie supprimee avec succes" });
  } catch (err) {
    console.error("Erreur suppression categorie:", err);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

module.exports = router;
