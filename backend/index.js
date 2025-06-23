const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json()); // permet de lire le JSON dans les requêtes

// Import des routes
const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

// Utilisation des routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);

// Route test
app.get("/", (req, res) => {
  res.send("API Budget fonctionne 🎯");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
