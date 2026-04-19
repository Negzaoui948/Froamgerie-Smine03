const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });
const express = require("express");
const mongoose = require("mongoose");
const config = require("config");
const cors = require("cors");
const users = require("./routes/api/users");
const products = require("./routes/api/Products");
const categories = require("./routes/api/Categories");
const createPaymentIntent = require("./routes/api/create-payment-intent");
const commercialClients = require("./routes/api/commercialClients");
const orders = require("./routes/api/orders");
const app = express();
let isMongoConnected = false;

// Pour analyser le corps des requêtes HTTP (JSON)
app.use(express.json());

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Autoriser le partage de ressources (CORS) avec envoi de cookies
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true
  })
);

// Servir les fichiers statiques (images) uniquement en local (Vercel: FS éphémère)
if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
}

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
app.use("/commercial-clients", commercialClients);
app.use("/orders", orders);
app.use("/stripe", createPaymentIntent);

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error("🔥 UNCAUGHT ERROR:", err);
  console.error("Stack:", err.stack);
  res.status(err.status || 500).json({
    status: "error",
    msg: err.message || "Erreur serveur interne"
  });
});

const port = process.env.PORT || 3015;

// Démarrer le serveur
if (process.env.NODE_ENV !== "production") {
    app.listen(port, () =>
        console.log(`Server running on port ${port}`)
    );
}

module.exports = app;
