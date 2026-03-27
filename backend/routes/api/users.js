const router = require("express").Router();
const bcrypt = require("bcryptjs");
const config = require("config");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const authMiddleware=require("../../middleware/authMiddleware")
const SUPER_ADMIN_EMAILS = [
    "oussama.negzaoui24@gmail.com",
    "abir.issaoui@gmail.com"
];
// @route POST api/users
// @desc Register new user
// @access Public
router.post("/register", async (req, res) => {
    // Destructure required fields from req.body
    const { username, email, password, role } = req.body;

    if (role === "admin") {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).send({
                status: "notauthorized",
                msg: "Acces refuse. Authentification requise pour creer un admin."
            });
        }

        try {
            const decoded = jwt.verify(token, config.get("jwtSecret"));
            const currentUser = await User.findById(decoded.id);

            if (!currentUser || !SUPER_ADMIN_EMAILS.includes(currentUser.email)) {
                return res.status(403).send({
                    status: "forbidden",
                    msg: "Seuls les super admins peuvent ajouter d'autres admins."
                });
            }
        } catch (err) {
            return res.status(401).send({
                status: "invalidtoken",
                msg: "Token invalide."
            });
        }
    }

    // Check if any required fields are missing
    if (!username || !email || !password) {
        return res
            .status(400)
            .send({ status: "notok", msg: "Please enter all required data" });
    }
    // Check if email already exists
    User.findOne({ email: email })
        .then((user) => {
            if (user) {
                return res
                    .status(400)
                    .send({ status: "notokmail", msg: "Email already exists" });
            }
            // Create a new user instance
            const newUser = new User({
                username,
                email,
                password,
                role,
            });
            // Generate salt and hash password
            bcrypt.genSalt(10, (err, salt) => {
                if (err) {
                    return res
                        .status(500)
                        .send({ status: "error", msg: "Internal server error" });
                }
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) {
                        return res
                            .status(500)
                            .send({ status: "error", msg: "Internal server error" });
                    }
                    // Replace plain password with hashed password
                    newUser.password = hash;
                    // Save the user to the database
                    newUser
                        .save()
                        .then((user) => {
                            // Generate JWT token
                            jwt.sign({ id: user.id },
                                config.get("jwtSecret"), { expiresIn: config.get("tokenExpire") },
                                (err, token) => {
                                    if (err) {
                                        return res
                                            .status(500)
                                            .send({ status: "error", msg: "Internal server error" });
                                    }
                                    // Send response with token and user details
                                    res
                                        .status(200)
                                        .send({
                                            status: "ok",
                                            msg: "Successfully registered",
                                            token,
                                            user,
                                        });
                                }
                            );
                        })
                        .catch((err) => {
                            return res
                                .status(500)
                                .send({ status: "error", msg: "Internal server error" });
                        });
                });
            });
        })
        .catch((err) => {
            return res
                .status(500)
                .send({ status: "error", msg: "Internal server error" });
        });
});
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Vérifier l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    // Générer le token
    const JWT_SECRET = config.get("jwtSecret");
    const tokenExpire = config.get("tokenExpire");

    const token = jwt.sign(
      { id: user._id, name: user.username },
      JWT_SECRET,
      { expiresIn: tokenExpire }
    );

    res.json({
      token,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
  
});
router.get("/home",authMiddleware, (req, res) => {
    res.json({msg: `Bienvenue ${req.user.name}! sur la page Home.`});
});
module.exports = router;
