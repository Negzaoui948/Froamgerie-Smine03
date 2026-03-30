const jwt = require("jsonwebtoken");
const config = require("config");

const authMiddleware = (req, res, next) => {
  const JWT_SECRET = process.env.JWT_SECRET || config.get("jwtSecret");

  // Récupérer le token depuis le header Authorization (Bearer token)
  const token = req.headers.authorization?.split(" ")[1];

  // Vérifier si le token existe
  if (!token) {
    return res.status(401).json({ message: "Accès refusé. Aucun token fourni." });
  }

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Ajouter les infos du user dans la requête
    req.user = decoded; // contient id, name, etc.
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalide." });
  }
};

module.exports = authMiddleware;
