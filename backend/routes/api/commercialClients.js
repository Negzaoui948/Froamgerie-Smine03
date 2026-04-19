const router = require("express").Router();
const authMiddleware = require("../../middleware/authMiddleware");
const CommercialClient = require("../../models/CommercialClient");

const requireCommercialRole = (req, res, next) => {
  if (req.user?.role !== "commercial") {
    return res.status(403).json({
      status: "forbidden",
      msg: "Acces reserve aux comptes commerciaux."
    });
  }
  next();
};

router.post("/", authMiddleware, requireCommercialRole, async (req, res) => {
const { nom, email } = req.body;

  if (!nom || !email) {
    return res.status(400).json({
      status: "notok",
      msg: "Veuillez renseigner le nom et l'email."
    });
  }
  try {
    const newClient = new CommercialClient({
      nom: nom.trim(),
      email: email.trim(),
      commercial: req.user.id
    });

    const savedClient = await newClient.save();
    return res.status(201).json({
      status: "ok",
      msg: "Client commercial ajoute.",
      client: savedClient
    });
  } catch (err) {
    console.error("Erreur creation client commercial:", err);
    return res.status(500).json({
      status: "error",
      msg: "Erreur serveur lors de la creation du client."
    });
  }
});

router.get("/", authMiddleware, requireCommercialRole, async (req, res) => {
  try {
    const clients = await CommercialClient.find({ commercial: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({
      status: "ok",
      clients
    });
  } catch (err) {
    console.error("Erreur recuperation clients commerciaux:", err);
    return res.status(500).json({
      status: "error",
      msg: "Erreur serveur lors de la lecture des clients."
    });
  }
});

module.exports = router;
