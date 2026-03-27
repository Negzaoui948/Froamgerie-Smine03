const express = require("express");
const mongoose = require("mongoose");
const config = require("config");
const cors = require("cors");
const users = require("./routes/api/users");
const products = require("./routes/api/Products");
const categories = require("./routes/api/Categories");
const createPaymentIntent = require("./routes/api/create-payment-intent");
const app = express();

// Pour analyser le corps des requêtes HTTP (JSON)
app.use(express.json());

// Autoriser le partage de ressources (CORS)
app.use(cors());

// Servir les fichiers statiques (images)
app.use('/uploads', express.static('uploads'));

// Connexion à MongoDB
const mongo_url = config.get("mongo_url");
mongoose.set("strictQuery", true);

mongoose
    .connect(mongo_url)
    .then(() => console.log("MongoDB connected..."))
    .catch((err) => console.log(err));

// Port du serveur
app.use("/users", users);
app.use("/categories", categories);
app.use("/produits", products);
app.use("/stripe", createPaymentIntent);
const port = process.env.PORT || 3015;

// Démarrer le serveur
app.listen(port, () =>
    console.log(`Server running on port ${port}`)
);
