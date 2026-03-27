import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  Grid
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { API_BASE_URL, buildApiUrl } from "../config/api";

const API_URL = buildApiUrl("/categories");

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ nom: "", description: "", image: null });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [editMode, setEditMode] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (data.status === "ok" && Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Erreur chargement categories:", error);
      setMessage({ text: "Impossible de charger les catégories", type: "error" });
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom || form.nom.trim() === "") {
      setMessage({ text: "Le nom de la catégorie est requis", type: "error" });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('nom', form.nom.trim());
      formData.append('description', form.description.trim());
      if (form.image) {
        formData.append('image', form.image);
      }

      const url = editMode ? `${API_URL}/update/${editingCategory._id}` : `${API_URL}/add`;
      const method = editMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        body: formData,
      });
      const data = await res.json();

      if (data.status === "ok") {
        setMessage({ text: editMode ? "Catégorie modifiée avec succès" : "Catégorie créée avec succès", type: "success" });
        setForm({ nom: "", description: "", image: null });
        setEditMode(false);
        setEditingCategory(null);
        await fetchCategories();
      } else {
        setMessage({ text: data.msg || "Erreur lors de l'opération", type: "error" });
      }
    } catch (error) {
      console.error("Erreur :", error);
      setMessage({ text: "Erreur réseau lors de l'opération", type: "error" });
    }
  };

  const handleEdit = (category) => {
    setForm({
      nom: category.nom,
      description: category.description || "",
      image: null // Reset image, will show current if exists
    });
    setEditMode(true);
    setEditingCategory(category);
  };

  const handleCancelEdit = () => {
    setForm({ nom: "", description: "", image: null });
    setEditMode(false);
    setEditingCategory(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Etes-vous sur de vouloir supprimer cette categorie ?")) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/delete/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.status === "ok") {
        setMessage({ text: "Categorie supprimee avec succes", type: "success" });
        await fetchCategories();
      } else {
        setMessage({ text: data.msg || "Erreur lors de la suppression", type: "error" });
      }
    } catch (error) {
      console.error("Erreur suppression categorie:", error);
      setMessage({ text: "Erreur reseau lors de la suppression", type: "error" });
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        Gestion des Catégories
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ text: "", type: "" })}>
          {message.text}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4, p: 3, border: "1px solid #ddd", borderRadius: 2, backgroundColor: "#f9f9f9" }}>
        <Typography variant="h6">{editMode ? "Modifier la catégorie" : "Ajouter une catégorie"}</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Nom de la catégorie"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              fullWidth
              required
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Description (optionnelle)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mt: 2, height: 56 }}
            >
              {editMode ? "Changer l'image" : "Image catégorie (optionnelle)"}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => setForm({ ...form, image: e.target.files[0] || null })}
              />
            </Button>
            {form.image && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                Nouveau fichier: {form.image.name}
              </Typography>
            )}
            {editMode && editingCategory?.image && !form.image && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption">Image actuelle:</Typography>
                <img src={`${API_BASE_URL}${editingCategory.image}`} alt="Current" style={{ maxWidth: '100px', maxHeight: '100px' }} />
              </Box>
            )}
          </Grid>
        </Grid>
        <Box sx={{ mt: 2 }}>
          <Button type="submit" variant="contained" sx={{ mr: 1 }}>
            {editMode ? "Modifier" : "Créer"}
          </Button>
          {editMode && (
            <Button variant="outlined" onClick={handleCancelEdit}>
              Annuler
            </Button>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : categories.length === 0 ? (
        <Alert severity="info">Aucune catégorie pour le moment.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat._id}>
                  <TableCell>{cat.nom}</TableCell>
                  <TableCell>{cat.description || "-"}</TableCell>
                  <TableCell>
                    <Button variant="outlined" size="small" onClick={() => handleEdit(cat)} sx={{ mr: 1 }}>
                      Modifier
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(cat._id)}
                    >
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default CategoryManager;
