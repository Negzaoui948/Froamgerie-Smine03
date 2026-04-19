const router = require("express").Router();
const bcrypt = require("bcryptjs");
const config = require("config");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const authMiddleware=require("../../middleware/authMiddleware")
const SUPER_ADMIN_EMAILS = [
    "oussama.negzaoui24@gmail.com"
    
];
const RESTRICTED_CREATION_ROLES = ["admin", "super_admin", "commercial"];
const isAdminRole = (role) => ["admin", "super_admin"].includes(role);
const JWT_SECRET = process.env.JWT_SECRET || config.get("jwtSecret");
const TOKEN_EXPIRE = process.env.TOKEN_EXPIRE || config.get("tokenExpire");
// @route POST api/users
// @desc Register new user
// @access Public
router.post("/register", async (req, res) => {
    // Destructure required fields from req.body
const { username, email, password, role, phone, address } = req.body;

    if (RESTRICTED_CREATION_ROLES.includes(role)) {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).send({
                status: "notauthorized",
                msg: "Acces refuse. Authentification requise pour creer ce type d'utilisateur."
            });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const currentUser = await User.findById(decoded.id);

            if (!currentUser) {
                return res.status(403).send({
                    status: "forbidden",
                    msg: "Utilisateur non trouve."
                });
            }

            // Seuls les super admins peuvent créer d'autres super admins
            if (role === "super_admin" && !SUPER_ADMIN_EMAILS.includes(currentUser.email)) {
                return res.status(403).send({
                    status: "forbidden",
                    msg: "Seuls les super admins peuvent créer d'autres super admins."
                });
            }

            // Les super admins et admins peuvent créer des admins normaux
            if (role === "admin" && !["admin", "super_admin"].includes(currentUser.role) && !SUPER_ADMIN_EMAILS.includes(currentUser.email)) {
                return res.status(403).send({
                    status: "forbidden",
                    msg: "Seuls les admins peuvent ajouter d'autres admins."
                });
            }

            if (role === "commercial" && !["admin", "super_admin"].includes(currentUser.role) && !SUPER_ADMIN_EMAILS.includes(currentUser.email)) {
                return res.status(403).send({
                    status: "forbidden",
                    msg: "Seuls les admins peuvent ajouter des commerciaux."
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
                    role: role || "user",
                    phone: phone || "",
                    address: address || ""
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
                            jwt.sign({ id: user.id, name: user.username, role: user.role },
                                JWT_SECRET, { expiresIn: TOKEN_EXPIRE },
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
router.get("/", authMiddleware, async (req, res) => {
  try {
    console.log("[GET /users] req.user:", req.user);
    const currentUser = await User.findById(req.user.id);
    console.log("[GET /users] currentUser found:", !!currentUser);
    
    if (!currentUser || (!isAdminRole(currentUser.role) && !SUPER_ADMIN_EMAILS.includes(currentUser.email))) {
      console.log("[GET /users] Forbidden - user not admin");
      return res.status(403).json({ status: "forbidden", msg: "Accès interdit." });
    }

    const users = await User.find().select("-password");
    console.log("[GET /users] Found users:", users.length);
    res.status(200).json({ status: "ok", users });
  } catch (err) {
    console.error("Erreur recuperation utilisateurs:", err);
    res.status(500).json({ status: "error", msg: "Erreur serveur lors de la lecture des utilisateurs." });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || (!isAdminRole(currentUser.role) && !SUPER_ADMIN_EMAILS.includes(currentUser.email))) {
      return res.status(403).json({ status: "forbidden", msg: "Accès interdit." });
    }

    const updatePayload = {};
    const { username, email, role } = req.body;
    if (username) updatePayload.username = username;
    if (email) updatePayload.email = email;
    if (role) updatePayload.role = role;

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updatePayload, { new: true }).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ status: "notok", msg: "Utilisateur non trouve." });
    }

    res.status(200).json({ status: "ok", user: updatedUser });
  } catch (err) {
    console.error("Erreur mise a jour utilisateur:", err);
    res.status(500).json({ status: "error", msg: "Erreur serveur lors de la mise a jour." });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || (!isAdminRole(currentUser.role) && !SUPER_ADMIN_EMAILS.includes(currentUser.email))) {
      return res.status(403).json({ status: "forbidden", msg: "Accès interdit." });
    }

    if (req.params.id === currentUser.id) {
      return res.status(400).json({ status: "notok", msg: "Vous ne pouvez pas supprimer votre propre compte." });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ status: "notok", msg: "Utilisateur non trouve." });
    }

    res.status(200).json({ status: "ok", msg: "Utilisateur supprime." });
  } catch (err) {
    console.error("Erreur suppression utilisateur:", err);
    res.status(500).json({ status: "error", msg: "Erreur serveur lors de la suppression." });
  }
});
router.get("/commercials", async (req, res) => {
  try {
    const commercials = await User.find({ role: "commercial" }).select(
      "username email"
    );
    res.status(200).json({ status: "ok", commercials });
  } catch (err) {
    console.error("Erreur recuperation commerciaux:", err);
    res.status(500).json({ status: "error", msg: "Erreur serveur lors de la lecture des commerciaux." });
  }
});
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Utilisateur non trouvé", msg: "Utilisateur non trouvé" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe incorrect", msg: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: user._id, name: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRE }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/"
    };

    res.cookie("auth_token", token, cookieOptions);
    res.cookie("auth_state", "true", { ...cookieOptions, httpOnly: false });
    res.cookie("user_role", user.role, { ...cookieOptions, httpOnly: false });
    res.cookie("user_name", user.username, { ...cookieOptions, httpOnly: false });
    res.cookie("user_email", user.email, { ...cookieOptions, httpOnly: false });

    res.json({
      message: "Connexion réussie",
      msg: "Connexion réussie",
      token,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", msg: "Erreur serveur" });
  }
});

router.post("/logout", authMiddleware, (req, res) => {
  res.clearCookie("auth_token", { path: "/" });
  res.clearCookie("auth_state", { path: "/" });
  res.clearCookie("user_role", { path: "/" });
  res.clearCookie("user_name", { path: "/" });
  res.clearCookie("user_email", { path: "/" });
  res.json({ status: "ok", msg: "Déconnecté." });
});

router.get("/me", authMiddleware, (req, res) => {
  res.json({
    status: "ok",
    user: {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role,
      email: req.user.email
    }
  });
});

router.get("/home", authMiddleware, (req, res) => {
  res.json({ msg: `Bienvenue ${req.user.name}! sur la page Home.` });
});
module.exports = router;
