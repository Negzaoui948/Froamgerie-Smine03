import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { buildApiUrl } from "../config/api";
import { resolveMediaUrl } from "../config/media";
import "./ClientDashboard.css";

const CATEGORY_URL = buildApiUrl("/categories");
const PRODUCTS_URL = buildApiUrl("/produits");
const categoryAccents = ["gold", "cream", "copper"];

function ClientDashboard() {
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCat, setSelectedCat] = useState(location.state?.selectedCategoryId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [heroMedia, setHeroMedia] = useState(null);

  useEffect(() => {
    const storedHero = localStorage.getItem("clientHeroMedia");
    if (storedHero) {
      try {
        setHeroMedia(JSON.parse(storedHero));
      } catch (err) {
        console.warn("Impossible de parser clientHeroMedia:", err);
        setHeroMedia(null);
      }
    }
  }, []);

  useEffect(() => {
    if (location.state?.selectedCategoryId) {
      setSelectedCat(location.state.selectedCategoryId);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [catRes, prodRes] = await Promise.all([
          fetch(CATEGORY_URL),
          fetch(PRODUCTS_URL)
        ]);

        const catData = await catRes.json();
        const prodData = await prodRes.json();

        setCategories(Array.isArray(catData.categories) ? catData.categories : []);
        setProducts(Array.isArray(prodData.produits) ? prodData.produits : []);
      } catch (err) {
        setError("Erreur lors du chargement des categories et des produits.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = selectedCat
    ? products.filter((product) => product.categorie && product.categorie._id === selectedCat)
    : products;

  const activeCategory = categories.find((category) => category._id === selectedCat);

  return (
    <main className="client-dashboard-page">
      <section className="client-hero">
        {heroMedia ? (
          heroMedia.kind === "video" ? (
            <video className="client-hero-media" src={heroMedia.src} autoPlay muted loop playsInline />
          ) : (
            <img className="client-hero-media" src={heroMedia.src} alt={heroMedia.name || "Visuel client"} />
          )
        ) : (
          <div className="client-hero-media" aria-hidden="true" />
        )}

        <div className="client-hero-overlay" />

        <div className="client-hero-content">
          <p className="client-eyebrow">Catalogue client</p>
          <h1>Retrouvez le meme univers que la page d'accueil</h1>
          <p>
            Explorez les categories, decouvrez les produits disponibles et
            consultez les details dans une interface proche de la page Home.
          </p>
          <div className="client-hero-actions">
            <button type="button" className="client-btn" onClick={() => setSelectedCat("")}>
              Voir tous les produits
            </button>
          </div>
        </div>
      </section>

      <section className="client-section">
        <div className="client-section-head">
          <p className="client-section-kicker">Nos categories</p>
          <h2>Des cartes dans le meme esprit que la Home</h2>
          <p>
            Cliquez sur une categorie pour filtrer rapidement les produits qui
            vous interessent.
          </p>
        </div>

        {error && <div className="client-alert">{error}</div>}

        <div className="client-filter-bar">
          <button
            type="button"
            className={`client-filter-pill${selectedCat ? "" : " is-active"}`}
            onClick={() => setSelectedCat("")}
          >
            Toutes
          </button>

          {categories.map((category) => (
            <button
              key={category._id}
              type="button"
              className={`client-filter-pill${selectedCat === category._id ? " is-active" : ""}`}
              onClick={() => setSelectedCat(category._id)}
            >
              {category.nom}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="client-empty-state">Chargement du catalogue...</div>
        ) : (
          <div className="client-category-grid">
            {categories.map((category, index) => (
              <article
                key={category._id}
                className={`client-category-card${
                  selectedCat === category._id ? " is-selected" : ""
                }`}
                onClick={() => setSelectedCat(category._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedCat(category._id);
                  }
                }}
              >
                {category.image ? (
                  <img
                    className="client-category-image"
                    src={resolveMediaUrl(category.image)}
                    alt={category.nom}
                  />
                ) : (
                  <div
                    className={`client-category-image client-category-placeholder client-card-${
                      categoryAccents[index % categoryAccents.length]
                    }`}
                    aria-hidden="true"
                  />
                )}

                <div className="client-category-body">
                  <h3>{category.nom}</h3>
                  <p>{category.description || "Selection disponible dans cette categorie."}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="client-section client-products-section">
        <div className="client-section-head">
          <p className="client-section-kicker">Produits</p>
          <h2>{activeCategory ? `Produits - ${activeCategory.nom}` : "Tous les produits"}</h2>
          <p>
            Consultez le prix, le stock et ouvrez la fiche detaillee de chaque
            produit.
          </p>
        </div>

        {loading ? (
          <div className="client-empty-state">Chargement des produits...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="client-empty-state">Aucun produit disponible pour ce filtre.</div>
        ) : (
          <div className="client-product-grid">
            {filteredProducts.map((product) => (
              <article className="client-product-card" key={product._id}>
                {product.images?.[0] ? (
                  <img
                    className="client-product-image"
                    src={resolveMediaUrl(product.images[0])}
                    alt={product.name}
                  />
                ) : (
                  <div className="client-product-image client-category-placeholder client-card-cream" aria-hidden="true" />
                )}

                <div className="client-product-body">
                  <div className="client-product-meta">
                    <h3>{product.name}</h3>
                    <span>{product.prixVente} DT</span>
                  </div>
                  <p>Stock disponible: {product.quantite}</p>
                  <button type="button" className="client-btn" onClick={() => setSelectedProduct(product)}>
                    Voir details
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedProduct && (
        <div className="client-modal-backdrop" onClick={() => setSelectedProduct(null)} role="presentation">
          <div
            className="client-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="client-modal-close"
              onClick={() => setSelectedProduct(null)}
              aria-label="Fermer"
            >
              x
            </button>

            {selectedProduct.images?.[0] ? (
              <img
                className="client-modal-image"
                src={resolveMediaUrl(selectedProduct.images[0])}
                alt={selectedProduct.name}
              />
            ) : (
              <div className="client-modal-image client-category-placeholder client-card-gold" aria-hidden="true" />
            )}

            <p className="client-section-kicker">Details produit</p>
            <h3>{selectedProduct.name}</h3>
            <p>Prix: {selectedProduct.prixVente} DT</p>
            <p>Stock: {selectedProduct.quantite}</p>
            <p>Categorie: {selectedProduct.categorie?.nom || "Non definie"}</p>

            <div className="client-hero-actions">
              <button
                type="button"
                className="client-btn client-btn-secondary"
                onClick={() => setSelectedProduct(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default ClientDashboard;
