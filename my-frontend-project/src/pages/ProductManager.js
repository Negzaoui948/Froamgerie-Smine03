import React, { useState, useEffect } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardMedia
} from "@mui/material";
import { Edit, Delete, CloudUpload } from "@mui/icons-material";
import { API_BASE_URL, buildApiUrl } from "../config/api";

const API_URL = buildApiUrl("/produits");

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", quantite: "", prixAchat: "", prixVente: "", unite: "", categorieId: "", images: [] });
  const [editForm, setEditForm] = useState({ name: "", description: "", quantite: "", prixAchat: "", prixVente: "", unite: "", categorieId: "", images: [], newImages: [] });
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Récupérer tous les produits (GET /products)
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (data.status === "ok" && data.produits) {
        setProducts(data.produits);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Erreur lors du chargement:", err);
      setMessage({ text: "Erreur de connexion au serveur", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(buildApiUrl("/categories"));
      const data = await res.json();
      if (data.status === "ok" && data.categories) {
        setCategories(data.categories);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Erreur chargement catégories:", err);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Ajouter produit (POST /products/add)
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.quantite || !form.prixAchat || !form.prixVente || !form.unite || !form.categorieId) {
      setMessage({ text: "Veuillez remplir tous les champs (choisir une catégorie existante)", type: "error" });
      return;
    }

    try {
      const categorieId = form.categorieId;

      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description || "");
      formData.append('quantite', form.quantite);
      formData.append('prixAchat', form.prixAchat);
      formData.append('prixVente', form.prixVente);
      formData.append('unite', form.unite);
      formData.append('categorie', categorieId);
      
      console.log(`Nombre d'images à ajouter: ${form.images.length}`);
      form.images.forEach((image, index) => {
        console.log(`Image ${index}: ${image.name}`);
        formData.append('images', image);
      });

      const res = await fetch(`${API_URL}/add`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log("Réponse du serveur (add):", data);
      
      if (data.status === "ok") {
        setMessage({ text: "Produit ajouté avec succès", type: "success" });
        setForm({ name: "", description: "", quantite: "", prixAchat: "", prixVente: "", unite: "", categorieId: "", images: [] });
        await fetchProducts();
      } else {
        setMessage({ text: data.msg || "Erreur lors de l'ajout", type: "error" });
      }
    } catch (err) {
      console.error("Erreur add:", err);
      setMessage({ text: "Erreur lors de l'ajout", type: "error" });
    }
  };

  // Ouvrir modal pour modifier
  const handleEditClick = (product) => {
    setEditingId(product._id);
    setEditForm({
      name: product.name,
      description: product.description || "",
      quantite: product.quantite,
      prixAchat: product.prixAchat || "",
      prixVente: product.prixVente || "",
      unite: product.unite || "",
      categorieId: product.categorie?._id || "",
      images: product.images || [],
      newImages: [] // Pour les nouvelles images à ajouter
    });
    setOpen(true);
  };

  // Modifier produit (PUT /products/update/:id)
  const handleUpdate = async () => {
    if (!editingId) return;

    if (!editForm.name || !editForm.quantite || !editForm.prixAchat || !editForm.prixVente || !editForm.unite || !editForm.categorieId) {
      setMessage({ text: "Veuillez remplir tous les champs (choisir une catégorie existante)", type: "error" });
      return;
    }

    try {
      const categorieId = editForm.categorieId;

      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('description', editForm.description || "");
      formData.append('quantite', editForm.quantite);
      formData.append('prixAchat', editForm.prixAchat);
      formData.append('prixVente', editForm.prixVente);
      formData.append('unite', editForm.unite);
      formData.append('categorie', categorieId);
      
      // Ajouter les nouvelles images si elles existent
      if (editForm.newImages && editForm.newImages.length > 0) {
        console.log(`Envoi de ${editForm.newImages.length} nouvelles images`);
        editForm.newImages.forEach((image, index) => {
          console.log(`Image ${index}: ${image.name}`);
          formData.append('images', image);
        });
      } else {
        console.log("Aucune nouvelle image sélectionnée - les anciennes images seront conservées");
      }

      const res = await fetch(`${API_URL}/update/${editingId}`, {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();
      console.log("Réponse du serveur:", data);
      
      if (data.status === "ok") {
        setMessage({ text: "Produit modifié avec succès", type: "success" });
        setOpen(false);
        await fetchProducts();
      } else {
        setMessage({ text: data.msg || "Erreur lors de la modification", type: "error" });
      }
    } catch (err) {
      console.error("Erreur update:", err);
      setMessage({ text: "Erreur lors de la modification", type: "error" });
    }
  };

  // Supprimer produit (DELETE /products/delete/:id)
  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit?")) {
      try {
        const res = await fetch(`${API_URL}/delete/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.status === "ok") {
          setMessage({ text: "Produit supprimé avec succès", type: "success" });
          await fetchProducts();
        } else {
          setMessage({ text: data.msg || "Erreur lors de la suppression", type: "error" });
        }
      } catch (err) {
        console.error("Erreur delete:", err);
        setMessage({ text: "Erreur lors de la suppression", type: "error" });
      }
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        Gestion des Produits
      </Typography>

      {/* Messages d'alerte */}
      {message.text && (
        <Alert
          severity={message.type}
          sx={{ mb: 3 }}
          onClose={() => setMessage({ text: "", type: "" })}
        >
          {message.text}
        </Alert>
      )}

      {/* Formulaire Ajout */}
      <Box
        component="form"
        onSubmit={handleAdd}
        sx={{
          mb: 4,
          p: 3,
          border: "1px solid #ddd",
          borderRadius: 2,
          backgroundColor: "#f9f9f9"
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Ajouter un nouveau produit
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Nom du produit"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              margin="normal"
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth
              margin="normal"
              multiline
              minRows={3}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Quantité"
              value={form.quantite}
              onChange={(e) => setForm({ ...form, quantite: e.target.value })}
              fullWidth
              margin="normal"
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Prix d'achat"
              value={form.prixAchat}
              onChange={(e) => setForm({ ...form, prixAchat: e.target.value })}
              type="number"
              fullWidth
              margin="normal"
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Prix de vente"
              value={form.prixVente}
              onChange={(e) => setForm({ ...form, prixVente: e.target.value })}
              type="number"
              fullWidth
              margin="normal"
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              SelectProps={{ native: true }}
              label="Unité"
              value={form.unite}
              onChange={(e) => setForm({ ...form, unite: e.target.value })}
              fullWidth
              margin="normal"
              required
            >
              <option value=""></option>
              <option value="kg">kg</option>
              <option value="litre">litre</option>
              <option value="piece">pièce</option>
              <option value="carton">carton</option>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              SelectProps={{ native: true }}
              label="Catégorie"
              value={form.categorieId}
              onChange={(e) => setForm({ ...form, categorieId: e.target.value })}
              fullWidth
              margin="normal"
              required
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.nom}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUpload />}
              sx={{ mt: 2, height: 56 }}
              fullWidth
            >
              Télécharger des images
              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={(e) => setForm({ ...form, images: Array.from(e.target.files) })}
              />
            </Button>
          </Grid>
        </Grid>
        {form.images.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Images sélectionnées:</Typography>
            <Grid container spacing={1}>
              {form.images.map((image, index) => (
                <Grid item xs={6} sm={4} md={3} key={index}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="100"
                      image={URL.createObjectURL(image)}
                      alt={`Image ${index + 1}`}
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        <Button variant="contained" color="primary" type="submit" sx={{ mt: 2 }} fullWidth>
          Ajouter un produit
        </Button>
      </Box>

      {/* Tableau Produits */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : products.length === 0 ? (
        <Alert severity="info">Aucun produit disponible. Commencez par en ajouter un!</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Nom</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Quantité</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Unité</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Prix Achat</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Prix Vente</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Catégorie</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Images</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id} hover>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.description || "-"}</TableCell>
                  <TableCell>{product.quantite}</TableCell>
                  <TableCell>{product.unite}</TableCell>
                  <TableCell>{product.prixAchat}</TableCell>
                  <TableCell>{product.prixVente}</TableCell>
                  <TableCell>{product.categorie ? product.categorie.nom : "-"}</TableCell>
                  <TableCell>
                    {product.images && product.images.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {product.images.slice(0, 3).map((image, index) => (
                          <img
                            key={index}
                            src={`${API_BASE_URL}${image}`}
                            alt={`Produit ${index + 1}`}
                            style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
                          />
                        ))}
                        {product.images.length > 3 && (
                          <Typography variant="caption">+{product.images.length - 3} autres</Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="textSecondary">Aucune image</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      startIcon={<Edit />}
                      onClick={() => handleEditClick(product)}
                      color="warning"
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    >
                      Modifier
                    </Button>
                    <Button
                      startIcon={<Delete />}
                      onClick={() => handleDelete(product._id)}
                      color="error"
                      size="small"
                      variant="outlined"
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

      {/* Modal Modifier */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Modifier le produit</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nom du produit"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                fullWidth
                margin="normal"
                multiline
                minRows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Quantité"
                value={editForm.quantite}
                onChange={(e) => setEditForm({ ...editForm, quantite: e.target.value })}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Prix d'achat"
                value={editForm.prixAchat}
                onChange={(e) => setEditForm({ ...editForm, prixAchat: e.target.value })}
                type="number"
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Prix de vente"
                value={editForm.prixVente}
                onChange={(e) => setEditForm({ ...editForm, prixVente: e.target.value })}
                type="number"
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                SelectProps={{ native: true }}
                label="Unité"
                value={editForm.unite}
                onChange={(e) => setEditForm({ ...editForm, unite: e.target.value })}
                fullWidth
                margin="normal"
              >
                <option value="">Sélectionner</option>
                <option value="kg">kg</option>
                <option value="litre">litre</option>
                <option value="piece">pièce</option>
                <option value="carton">carton</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                SelectProps={{ native: true }}
                label="Catégorie"
                value={editForm.categorieId}
                onChange={(e) => setEditForm({ ...editForm, categorieId: e.target.value })}
                fullWidth
                margin="normal"
                required
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.nom}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                sx={{ mt: 2, height: 56 }}
                fullWidth
              >
                Ajouter de nouvelles images
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={(e) => setEditForm({ ...editForm, newImages: Array.from(e.target.files) })}
                />
              </Button>
            </Grid>
          </Grid>
          {editForm.images.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Images actuelles:</Typography>
              <Grid container spacing={1}>
                {editForm.images.map((image, index) => (
                  <Grid item xs={6} sm={4} md={3} key={index}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="100"
                        image={`${API_BASE_URL}${image}`}
                        alt={`Image actuelle ${index + 1}`}
                      />
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          {editForm.newImages.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Nouvelles images à ajouter:</Typography>
              <Grid container spacing={1}>
                {editForm.newImages.map((image, index) => (
                  <Grid item xs={6} sm={4} md={3} key={index}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="100"
                        image={URL.createObjectURL(image)}
                        alt={`Nouvelle image ${index + 1}`}
                      />
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleUpdate} color="primary">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductManager;
