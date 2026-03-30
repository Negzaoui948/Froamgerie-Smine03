require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });
const express = require("express");
const mongoose = require("mongoose");
const config = require("config");
const cors = require("cors");
const users = require("./routes/api/users");
const products = require("./routes/api/Products");
const categories = require("./routes/api/Categories");
const createPaymentIntent = require("./routes/api/create-payment-intent");
const app = express();
let isMongoConnected = false;

// Pour analyser le corps des requêtes HTTP (JSON)
app.use(express.json());

// Autoriser le partage de ressources (CORS)
app.use(cors());

// Servir les fichiers statiques (images)
app.use('/uploads', express.static('uploads'));

// Connexion à MongoDB
const mongo_url = process.env.MONGO_URL || config.get("mongo_url");
mongoose.set("strictQuery", true);

const connectToDatabase = async () => {
    if (isMongoConnected) {
        return;
    }

    await mongoose.connect(mongo_url);
    isMongoConnected = true;
    console.log("MongoDB connected...");
};

connectToDatabase().catch((err) => console.log(err));

// Port du serveur
app.use("/users", users);
app.use("/categories", categories);
app.use("/produits", products);
app.use("/stripe", createPaymentIntent);
const port = process.env.PORT || 3015;

// Démarrer le serveur
if (process.env.NODE_ENV !== "production") {
    app.listen(port, () =>
        console.log(`Server running on port ${port}`)
    );
}

module.exports = app;
