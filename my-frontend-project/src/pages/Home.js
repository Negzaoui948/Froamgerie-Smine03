import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { API_BASE_URL, buildApiUrl } from "../config/api";
import "./Home.css";

const categoryAccents = ["gold", "cream", "copper"];

function Home() {
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [clientHeroMedia, setClientHeroMedia] = useState(() => {
    const savedMedia = localStorage.getItem("clientHeroMedia");
    if (savedMedia) {
      return JSON.parse(savedMedia);
    }

    const legacyVideo = localStorage.getItem("clientHeroVideo");
    return legacyVideo ? { kind: "video", src: legacyVideo, name: "video" } : null;
  });
  const token = localStorage.getItem("token");
  const productsSectionRef = useRef(null);
  const contactSectionRef = useRef(null);

  useEffect(() => {
    if (!token) {
      window.location.href = "/";
      return;
    }

    axios
      .get(buildApiUrl("/users/home"), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then((res) => setMessage(res.data.msg))
      .catch(() => {
        window.location.href = "/";
      });
  }, [token]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(buildApiUrl("/categories"));
        const data = await response.json();

        if (data.status === "ok" && Array.isArray(data.categories)) {
          setCategories(data.categories);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Erreur chargement categories:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const savedMedia = localStorage.getItem("clientHeroMedia");

    if (savedMedia) {
      setClientHeroMedia(JSON.parse(savedMedia));
      return;
    }

    const legacyVideo = localStorage.getItem("clientHeroVideo");
    setClientHeroMedia(legacyVideo ? { kind: "video", src: legacyVideo, name: "video" } : null);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await fetch(buildApiUrl("/produits"));
        const data = await response.json();
        setProducts(Array.isArray(data.produits) ? data.produits : []);
      } catch (error) {
        console.error("Erreur chargement produits:", error);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (location.hash === "#contact") {
      window.requestAnimationFrame(() => {
        contactSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [location.hash]);

  const handleCategoryClick = (categoryId) => {
    setSelectedCategoryId(categoryId);
    window.requestAnimationFrame(() => {
      productsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const selectedCategory = categories.find((category) => category._id === selectedCategoryId);
  const filteredProducts = selectedCategoryId
    ? products.filter((product) => product.categorie?._id === selectedCategoryId)
    : products;

  return (
    <main className="home-page">
      <section className="hero-video">
        {clientHeroMedia?.kind === "video" ? (
          <video autoPlay muted loop playsInline className="bg-video" aria-label="Video de presentation">
            <source src={clientHeroMedia.src} type="video/mp4" />
          </video>
        ) : clientHeroMedia?.kind === "image" ? (
          <img className="bg-video client-hero-image" src={clientHeroMedia.src} alt="Visuel de presentation" />
        ) : (
          <div className="bg-video bg-video-fallback" aria-hidden="true" />
        )}
        <div className="overlay" />

        <div className="welcome-text">
          <h2>Bienvenue</h2>
          <h1>Fromagerie Smine</h1>
          <p>
            Decouvrez une selection de fromages artisanaux tunisiens, prepares
            avec soin pour offrir qualite, fraicheur et saveur authentique.
          </p>
          <button
            className="btn"
            type="button"
            onClick={() => {
              setSelectedCategoryId("");
              productsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            Decouvrir nos produits
          </button>
        </div>
      </section>

      <section className="content-section intro-section">
        <div className="section-heading">
          <span className="section-kicker">Notre selection</span>
          <h2>Des produits artisanaux pour tous les gouts</h2>
        </div>
        <p className="section-copy">
          {message ||
            "Parcourez nos categories et retrouvez rapidement les produits qui correspondent a vos besoins."}
        </p>
      </section>

      <section className="content-section products-section">
        <div className="section-heading">
          <span className="section-kicker">Categories</span>
          <h2>Explorez nos gammes</h2>
        </div>

        <div className="products-grid">
          {categories.map((category, index) => (
            <article
              className={`product-card product-card-clickable${
                selectedCategoryId === category._id ? " product-card-selected" : ""
              }`}
              key={category._id}
              onClick={() => handleCategoryClick(category._id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleCategoryClick(category._id);
                }
              }}
            >
              {category.image ? (
                <img
                  className="card-img-top card-category-image"
                  src={`${API_BASE_URL}${category.image}`}
                  alt={category.nom}
                />
              ) : (
                <div
                  className={`card-img-top card-visual-${
                    categoryAccents[index % categoryAccents.length]
                  }`}
                  aria-hidden="true"
                />
              )}
              <h3 className="card-title">{category.nom}</h3>
              <p className="card-text">
                {category.description || "Cliquez pour afficher les produits de cette categorie."}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section ref={productsSectionRef} className="content-section catalog-section">
        <div className="section-heading">
          <span className="section-kicker">Produits</span>
          <h2>{selectedCategory ? `Selection - ${selectedCategory.nom}` : "Notre catalogue"}</h2>
        </div>

        <div className="catalog-toolbar">
          <button
            className={`filter-chip${selectedCategoryId ? "" : " filter-chip-active"}`}
            type="button"
            onClick={() => setSelectedCategoryId("")}
          >
            Tous
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              className={`filter-chip${
                selectedCategoryId === category._id ? " filter-chip-active" : ""
              }`}
              type="button"
              onClick={() => setSelectedCategoryId(category._id)}
            >
              {category.nom}
            </button>
          ))}
        </div>

        {loadingProducts ? (
          <p className="empty-state">Chargement des produits...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="empty-state">Aucun produit disponible pour cette categorie.</p>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <article className="product-card" key={product._id}>
                {product.images?.[0] ? (
                  <img
                    className="card-img-top card-category-image"
                    src={`${API_BASE_URL}${product.images[0]}`}
                    alt={product.name}
                  />
                ) : (
                  <div className="card-img-top card-visual-cream" aria-hidden="true" />
                )}
                <h3 className="card-title">{product.name}</h3>
                <p className="card-text">Prix: {product.prixVente} DT</p>
                {product.description && <p className="card-text">{product.description}</p>}
              </article>
            ))}
          </div>
        )}
      </section>

      <section ref={contactSectionRef} id="contact" className="content-section contact-section">
        <div className="contact-shell">
          <div className="section-heading contact-heading">
            <span className="section-kicker">Contact</span>
            <h2>Contactez-nous</h2>
            <p className="section-copy">
              Retrouvez-nous a Nabeul ou laissez-nous un message pour toute demande sur nos
              produits artisanaux.
            </p>
          </div>

          <div className="contact-grid">
            <article className="contact-card contact-info-card">
              <h3>Coordonnees</h3>
              <p className="contact-line">
                <strong>Adresse</strong>
                <span>Kawniya, Nabeul</span>
              </p>
              <p className="contact-line">
                <strong>Telephone</strong>
                <span>20344677</span>
              </p>
              <p className="contact-line">
                <strong>Email</strong>
                <span>fromageriesmine@gmail.com</span>
              </p>

              <div className="contact-map-frame">
                <iframe
                  title="Carte Google Maps Fromagerie Smine"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1380.6903528242242!2d10.728986014883537!3d36.447894241713826!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x13029909f2b92049%3A0xe84d679aa1ecb7d5!2sFromagerie%20Smine!5e0!3m2!1sfr!2stn!4v1761501484881!5m2!1sfr!2stn"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </article>

            <article className="contact-card contact-form-card">
              <h3>Envoyez-nous un message</h3>
              <form className="contact-form">
                <label className="contact-field">
                  <span>Nom</span>
                  <input type="text" placeholder="Votre nom" />
                </label>

                <label className="contact-field">
                  <span>Email</span>
                  <input type="email" placeholder="vous@exemple.com" />
                </label>

                <label className="contact-field">
                  <span>Message</span>
                  <textarea rows="5" placeholder="Ecrivez votre message..." />
                </label>

                <button className="btn contact-submit" type="submit">
                  Envoyer
                </button>
              </form>
            </article>
          </div>
        </div>
      </section>

      <footer>
        <p>Fromagerie Smine - Qualite artisanale et savoir-faire tunisien.</p>
      </footer>
    </main>
  );
}

export default Home;
