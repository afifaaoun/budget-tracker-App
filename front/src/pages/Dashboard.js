import React, { useState, useEffect, useMemo } from "react";
import api from "../service/api";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const navigate = useNavigate();

  // Fetch transactions
  const fetchTransactions = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Utilisateur non connecté. Veuillez vous connecter.");
      return;
    }

    try {
      const res = await api.get("/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data.transactions);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des transactions.");
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Add or update transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Utilisateur non connecté. Veuillez vous connecter.");
      return;
    }

    try {
      if (editingTransaction) {
        // Update existing
        await api.put(
          `/transactions/${editingTransaction._id}`,
          { type, category, amount: Number(amount), description },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMessage("Transaction modifiée !");
      } else {
        // Add new
        await api.post(
          "/transactions",
          { type, category, amount: Number(amount), description },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMessage("Transaction ajoutée !");
      }

      // Reset form
      setAmount("");
      setCategory("");
      setDescription("");
      setType("expense");
      setEditingTransaction(null);

      fetchTransactions();
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors de l'enregistrement.");
    }
  };

  // Delete transaction
  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette transaction ?")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Utilisateur non connecté. Veuillez vous connecter.");
      return;
    }

    try {
      await api.delete(`/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Transaction supprimée !");
      fetchTransactions();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la suppression.");
    }
  };

  // Prepare for editing
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setType(transaction.type);
    setCategory(transaction.category);
    setAmount(transaction.amount.toString());
    setDescription(transaction.description || "");
    setMessage("");
    setError(null);
  };

  // Totals
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Columns React Table, includes actions column
  const columns = useMemo(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: (info) =>
          info.getValue()
            ? new Date(info.getValue()).toLocaleDateString()
            : "-",
      },
      {
        accessorKey: "category",
        header: "Catégorie",
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: (info) => (info.getValue() === "income" ? "Revenu" : "Dépense"),
      },
      {
        accessorKey: "amount",
        header: "Montant (€)",
        cell: (info) => info.getValue().toFixed(2),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (info) => info.getValue() || "-",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(row.original)}
              className="text-blue-600 hover:text-blue-800 font-semibold"
              aria-label="Modifier la transaction"
            >
              Modifier
            </button>
            <button
              onClick={() => handleDelete(row.original._id)}
              className="text-red-600 hover:text-red-800 font-semibold"
              aria-label="Supprimer la transaction"
            >
              Supprimer
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // Setup React Table
  const table = useReactTable({
    data: transactions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
      >
        Déconnexion
      </button>

      <h1 className="text-3xl font-bold mb-4">Suivi de Budget</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {message && <p className="text-green-600 mb-4">{message}</p>}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-100 text-green-700 p-4 rounded-xl">
          <p className="text-sm">Revenus</p>
          <p className="text-2xl font-semibold">{totalIncome.toFixed(2)} €</p>
        </div>
        <div className="bg-red-100 text-red-700 p-4 rounded-xl">
          <p className="text-sm">Dépenses</p>
          <p className="text-2xl font-semibold">{totalExpense.toFixed(2)} €</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-xl shadow space-y-4 mb-6"
      >
        <h2 className="text-xl font-semibold">
          {editingTransaction ? "Modifier la transaction" : "Nouvelle transaction"}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="expense">Dépense</option>
            <option value="income">Revenu</option>
          </select>
          <input
            type="text"
            placeholder="Catégorie (ex: courses)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border p-2 rounded"
            required
          />
        </div>
        <input
          type="number"
          placeholder="Montant (€)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border p-2 rounded"
          required
          min="0.01"
          step="0.01"
        />
        <input
          type="text"
          placeholder="Description (facultatif)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          {editingTransaction ? "Enregistrer" : "Ajouter"}
        </button>

        {editingTransaction && (
          <button
            type="button"
            onClick={() => {
              setEditingTransaction(null);
              setAmount("");
              setCategory("");
              setDescription("");
              setType("expense");
              setMessage("");
              setError(null);
            }}
            className="text-gray-600 hover:text-gray-800"
          >
            Annuler la modification
          </button>
        )}
      </form>

      <h2 className="text-xl font-semibold mb-2">Historique</h2>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    onClick={header.column.getToggleSortingHandler()}
                    className="cursor-pointer select-none border p-2 text-left"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted()] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-4 text-center text-gray-500">
                  Aucune transaction trouvée.
                </td>
              </tr>
            )}
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="even:bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="border p-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
