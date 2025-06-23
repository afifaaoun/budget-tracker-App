const Transaction = require("../models/Transaction");

// Créer une transaction
const createTransaction = async (req, res) => {
      console.log("UserId dans createTransaction:", req.userId);  // pour vérifier
  try {
    const { type, category, amount, date, description } = req.body;
    const transaction = new Transaction({
      user: req.userId,
      type,
      category,
      amount,
      date,
      description,
    });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la création" });
  }
};

// Obtenir toutes les transactions de l'utilisateur

const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, category, month, year } = req.query;

    const query = { user: req.userId };

    if (type) query.type = type; // 'income' ou 'expense'
    if (category) query.category = category;
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(query),
    ]);

    res.json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      transactions,
    });
  } catch (err) {
    console.error("Erreur dans getTransactions :", err);
    res.status(500).json({ message: "Erreur lors de la récupération des transactions" });
  }
};


// Supprimer une transaction
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Transaction.findOneAndDelete({ _id: id, user: req.userId });
    if (!deleted) return res.status(404).json({ message: "Transaction introuvable" });
    res.json({ message: "Transaction supprimée" });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression" });
  }
};

// Modifier une transaction
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Transaction.findOneAndUpdate(
      { _id: id, user: req.userId },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Transaction introuvable" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la modification" });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  deleteTransaction,
  updateTransaction,
};
