import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { buildApiUrl } from "../config/api";
import { resolveMediaUrl } from "../config/media";
import "./gros.css";

const categoryAccents = ["gold", "cream", "copper"];

const parseApiResponse = async (response) => {
  const text = await response.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
};

function GrosPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem("role") || "";
  const isGrosClient = userRole === "user";
  
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCat, setSelectedCat] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [cartMessage, setCartMessage] = useState("");
  const [cartMessageType, setCartMessageType] = useState("success");
  const [wholesaleCustomer, setWholesaleCustomer] = useState({
    nom: "",
    phone: "",
    email: "",
    localisation: ""
  });
  const [commercialOptions, setCommercialOptions] = useState([]);
  const [selectedCommercialId, setSelectedCommercialId] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(localStorage.getItem("token")));
  const [activeView, setActiveView] = useState("catalog");
  const [clientHeroMedia, setClientHeroMedia] = useState(() => {
    const savedMedia = localStorage.getItem("clientHeroMedia");
    if (savedMedia) {
      return JSON.parse(savedMedia);
    }
    const legacyVideo = localStorage.getItem("clientHeroVideo");
    return legacyVideo ? { kind: "video", src: legacyVideo, name: "video" } : null;
  });
  const viewSections = {
    catalog: "products",
    cart: "cart",
  };
  const viewLabels = [
    { key: "catalog", label: "Explorer la sélection" },
    { key: "cart", label: "Panier actif" },
  ];

  const handleViewToggle = (viewKey) => {
    setActiveView(viewKey);
    scrollToSection(viewSections[viewKey]);
  };

  const hasWholesaleInfo = useMemo(
    () =>
      ["nom", "phone", "email", "localisation"].every((field) =>
        Boolean(wholesaleCustomer[field]?.trim())
      ),
    [wholesaleCustomer]
  );

  const checkoutRequirements = useMemo(() => {
    const reasons = [];
    if (!cartItems.length) {
      reasons.push("Ajoutez au moins un produit au panier.");
    }
    if (!hasWholesaleInfo) {
      reasons.push("Complétez les informations du client en gros.");
    }
    if (!selectedCommercialId) {
      reasons.push("Choisissez un commercial référent.");
    }
    return reasons;
  }, [cartItems.length, hasWholesaleInfo, selectedCommercialId]);

  const canValidateOrder = checkoutRequirements.length === 0 && isLoggedIn;

  const scrollToSection = useCallback((sectionId) => {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.location.hash = sectionId;
  }, []);

  useEffect(() => {
    const storedCustomer = localStorage.getItem("grosCustomerInfo");
    if (!storedCustomer) {
      return;
    }

    try {
      const parsed = JSON.parse(storedCustomer);
      setWholesaleCustomer((current) => ({
        ...current,
        ...parsed
      }));
    } catch (err) {
      console.error("Impossible de parser le client commercial en mémoire:", err);
    }
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      setIsLoggedIn(Boolean(localStorage.getItem("token")));
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const fetchCommercialOptions = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl("/users/commercials"));
      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data?.msg || data?.message || data?.text || "Impossible de charger les commerciaux.");
      }

      setCommercialOptions(Array.isArray(data.commercials) ? data.commercials : []);
    } catch (err) {
      console.error("Erreur chargement commerciaux:", err);
      setCommercialOptions([]);
    }
  }, []);

  const fetchGrosOrders = useCallback(async () => {
    if (!isGrosClient && userRole !== "commercial" && userRole !== "admin" && userRole !== "super_admin") {
      setOrders([]);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token || !isLoggedIn) {
      setOrders([]);
      return;
    }

    setOrdersLoading(true);
    setOrdersError("");

    try {
      const response = await fetch(buildApiUrl("/orders/client"), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data?.msg || data?.message || data?.text || "Impossible de charger les commandes.");
      }

      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      setOrdersError(err.message || "Impossible de charger les commandes.");
    } finally {
      setOrdersLoading(false);
    }
  }, [isGrosClient, isLoggedIn, userRole]);


  const addToCart = (product) => {
    const price = Number(product.prixVenteGros || product.prixVente || 0);
    if (!price) {
      setCartMessageType("error");
      setCartMessage("Ce produit n'a pas de prix en gros défini.");
      return;
    }

    setCartItems((current) => {
      const existing = current.find((item) => item.productId === product._id);
      if (existing) {
        return current.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...current,
        {
          productId: product._id,
          name: product.name,
          quantity: 1,
          price,
          unit: product.uniteGros || product.unite
        }
      ];
    });

    setCartMessageType("success");
    setCartMessage(`${product.name} ajouté au panier.`);
  };

  const updateCartQuantity = (productId, delta) => {
    setCartItems((current) =>
      current
        .map((item) => {
          if (item.productId !== productId) {
            return item;
          }

          const nextQuantity = item.quantity + delta;
          if (nextQuantity <= 0) {
            return null;
          }

          return { ...item, quantity: nextQuantity };
        })
        .filter(Boolean)
    );
  };

  const removeCartItem = (productId) => {
    setCartItems((current) => current.filter((item) => item.productId !== productId));
  };

  const handleWholesaleCustomerChange = (field, value) => {
    setWholesaleCustomer((current) => {
      const next = { ...current, [field]: value };
      try {
        localStorage.setItem("grosCustomerInfo", JSON.stringify(next));
      } catch (err) {
        console.warn("Impossible de mémoriser le client commercial:", err);
      }
      return next;
    });
  };

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      setCartMessageType("error");
      setCartMessage("Connectez-vous pour valider la commande.");
      navigate("/gros/login");
      return;
    }

    if (checkoutRequirements.length) {
      setCartMessageType("error");
      setCartMessage(checkoutRequirements[0]);
      return;
    }

    setCartMessageType("success");
    setCartMessage("Envoi de votre commande...");  

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(buildApiUrl("/orders/client"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerName: wholesaleCustomer.nom.trim(),
          customerEmail: wholesaleCustomer.email.trim(),
          customerPhone: wholesaleCustomer.phone.trim(),
          customerLocation: wholesaleCustomer.localisation.trim(),
          commercialId: selectedCommercialId,
          items: cartItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            unit: item.unit
          }))
        })
      });

      const data = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(data?.msg || data?.message || data?.text || "Impossible d'enregistrer la commande.");
      }

      setCartMessageType("success");
      setCartMessage("Votre demande a été enregistrée.");
      setCartItems([]);
      fetchGrosOrders();
    } catch (err) {
      setCartMessageType("error");
      setCartMessage(err.message || "Une erreur est survenue pendant la validation.");
    }
  };

  const cartSummary = useMemo(() => {
    const quantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const total = cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
    return { quantity, total };
  }, [cartItems]);

  const selectedCommercial = useMemo(
    () => commercialOptions.find((option) => option._id === selectedCommercialId),
    [commercialOptions, selectedCommercialId]
  );

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      setError("");

      try {
        const [categoriesRes, productsRes] = await Promise.all([
          fetch(buildApiUrl("/categories")),
          fetch(buildApiUrl("/produits"))
        ]);

        const categoriesData = await categoriesRes.json();
        const productsData = await productsRes.json();

        setCategories(Array.isArray(categoriesData.categories) ? categoriesData.categories : []);
        setProducts(Array.isArray(productsData.produits) ? productsData.produits : []);
      } catch (err) {
        console.error("Erreur chargement catalogue commercial:", err);
        setError("Impossible de charger le catalogue commercial pour le moment.");
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  useEffect(() => {
    fetchCommercialOptions();
  }, [fetchCommercialOptions]);

  useEffect(() => {
    fetchGrosOrders();
  }, [fetchGrosOrders]);

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
    if (commercialOptions.length && !selectedCommercialId) {
      setSelectedCommercialId(commercialOptions[0]._id);
    }
  }, [commercialOptions, selectedCommercialId]);

  useEffect(() => {
    if (location.pathname !== "/gros") {
      return;
    }

    const sectionKey = location.hash?.replace("#", "");
    if (!sectionKey) {
      return;
    }

    scrollToSection(sectionKey);
    const hashToViewMap = {
      products: "catalog",
      cart: "cart"
    };
    if (hashToViewMap[sectionKey]) {
      setActiveView(hashToViewMap[sectionKey]);
    }
  }, [location, scrollToSection]);

  const wholesaleProducts = useMemo(
    () => products.filter((product) => product.venteParGros),
    [products]
  );

  const filteredProducts = selectedCat
    ? wholesaleProducts.filter((product) => product.categorie?._id === selectedCat)
    : wholesaleProducts;

  const wholesaleCategories = useMemo(
    () =>
      categories.filter((category) =>
        wholesaleProducts.some((product) => product.categorie?._id === category._id)
      ),
    [categories, wholesaleProducts]
  );

  const selectedCategory = wholesaleCategories.find((category) => category._id === selectedCat);

  const getBulkCountForCategory = (categoryId) =>
    wholesaleProducts.filter((product) => product.categorie?._id === categoryId).length;

  return (
    <main className="commercial-page">
      <section className="commercial-hero-video">
        {clientHeroMedia?.kind === "video" ? (
          <video autoPlay muted loop playsInline className="commercial-bg-video" aria-label="Video de presentation">
            <source src={clientHeroMedia.src} type="video/mp4" />
          </video>
        ) : clientHeroMedia?.kind === "image" ? (
          <img className="commercial-bg-video commercial-hero-image" src={clientHeroMedia.src} alt="Visuel de presentation" />
        ) : (
          <div className="commercial-bg-video commercial-bg-video-fallback" aria-hidden="true" />
        )}
        <div className="commercial-overlay" />

        <div className="commercial-welcome-text">
          <h2>Bienvenue a</h2>
          <h1>Fromagerie Smine - Vente en gros</h1>
          <p>
            Decouvrez notre selection exclusive de fromages artisanaux en gros,
            preparees avec soin pour offrir qualite, fraicheur et saveur authentique.
          </p>
          <button
            className="commercial-btn commercial-welcome-btn"
            type="button"
            onClick={() => scrollToSection("products")}
          >
            Explorer notre selection
          </button>
        </div>
      </section>

      

      <section className="commercial-view-toolbar">
        <div className="commercial-view-toggle">
          {viewLabels.map((view) => (
            <button
              key={view.key}
              type="button"
              className={`commercial-view-pill${activeView === view.key ? " is-active" : ""}`}
              onClick={() => handleViewToggle(view.key)}
            >
              {view.label}
            </button>
          ))}
        </div>
      </section>

      <section className="commercial-section">
        <div className="commercial-section-head">
          <p className="commercial-section-kicker">Nos catégories</p>
          <h2>Choisissez la famille de produits qui vous intéresse</h2>
          <p>
            Toutes les catégories listées ici conservent une sélection d'articles disponibles à la vente
            en gros, avec leurs prix par groupe.
          </p>
        </div>

        <div className="commercial-filter-bar">
          <button
            type="button"
            className={`commercial-filter-pill${selectedCat ? "" : " is-active"}`}
            onClick={() => setSelectedCat("")}
          >
            Toutes
          </button>
          {wholesaleCategories.map((category) => (
            <button
              key={category._id}
              type="button"
              className={`commercial-filter-pill${selectedCat === category._id ? " is-active" : ""}`}
              onClick={() => setSelectedCat(category._id)}
            >
              {category.nom}
            </button>
          ))}
        </div>

        <div className="commercial-category-grid">
          {wholesaleCategories.map((category, index) => {
            const bulkCount = getBulkCountForCategory(category._id);
            const hasBulk = bulkCount > 0;
            return (
              <article
                key={category._id}
                className={`commercial-category-card${selectedCat === category._id ? " is-selected" : ""}`}
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
                    className="commercial-category-image"
                    src={resolveMediaUrl(category.image)}
                    alt={category.nom}
                  />
                ) : (
                  <div
                    className={`commercial-category-image commercial-category-placeholder commercial-card-${categoryAccents[index % categoryAccents.length]}`}
                    aria-hidden="true"
                  />
                )}

                <div className="commercial-category-body">
                  <h3>{category.nom}</h3>
                  <p>{category.description || "Sélection disponible en gros."}</p>
                  {hasBulk && <span className="commercial-category-badge">{bulkCount} articles</span>}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="products" className="commercial-section commercial-products-section">
        <div className="commercial-section-head">
          <p className="commercial-section-kicker">Articles en gros</p>
          <h2>{selectedCategory ? `Produits - ${selectedCategory.nom}` : "Tous les articles en gros"}</h2>
          <p>
            Découvrez les prix par groupe, les stocks disponibles et les unités pour chaque référence.
          </p>
        </div>

        {error && <div className="commercial-alert">{error}</div>}

        {loading ? (
          <div className="commercial-empty-state">Chargement du catalogue...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="commercial-empty-state">
            Aucun produit en gros disponible pour ce filtre. Essayez une autre catégorie.
          </div>
        ) : (
          <div className="commercial-product-grid">
            {filteredProducts.map((product) => (
              <article key={product._id} className="commercial-product-card">
                {product.images?.[0] ? (
                  <img
                    className="commercial-product-image"
                    src={resolveMediaUrl(product.images[0])}
                    alt={product.name}
                  />
                ) : (
                  <div className="commercial-product-image commercial-category-placeholder commercial-card-gold" aria-hidden="true" />
                )}

                <div className="commercial-product-body">
                  <div className="commercial-product-meta">
                    <h3>{product.name}</h3>
                    <span>{product.quantite} {product.uniteGros || product.unite}</span>
                  </div>
                  <p className="commercial-product-price">
                    {product.prixVenteGros
                      ? `${product.prixVenteGros} DT / ${product.uniteGros || product.unite}`
                      : "Prix à définir"}
                  </p>
                  <p className="commercial-product-description">{product.description || "Article disponible en vente par gros."}</p>
                  <button
                    type="button"
                    className="commercial-btn commercial-btn-secondary"
                    onClick={() => addToCart(product)}
                  >
                    Ajouter au panier
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="cart" className="commercial-section commercial-cart-section">
        <div className="commercial-section-head">
          <p className="commercial-section-kicker">Panier en gros</p>
          <h2>Composez, ajustez et validez votre sélection</h2>
          <p>
            Ajoutez les articles à votre panier, puis connectez-vous pour confirmer la commande avec votre
            commercial référent.
          </p>
        </div>

        <div className="commercial-cart-grid">
          <div className="commercial-cart-items">
            {cartItems.length === 0 ? (
              <div className="commercial-empty-state">
                Aucun article pour le moment. Choisissez une référence et cliquez sur "Ajouter au panier".
              </div>
            ) : (
              cartItems.map((item) => (
                <article key={item.productId} className="commercial-cart-item">
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      {item.quantity} × {item.price} DT / {item.unit}
                    </p>
                  </div>
                  <div className="commercial-cart-item-actions">
                    <button type="button" onClick={() => updateCartQuantity(item.productId, -1)} aria-label={`Réduire ${item.name}`}>
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => updateCartQuantity(item.productId, 1)} aria-label={`Augmenter ${item.name}`}>
                      +
                    </button>
                    <button type="button" className="commercial-cart-remove" onClick={() => removeCartItem(item.productId)}>
                      Supprimer
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="commercial-cart-sidebar">
            <div className="commercial-cart-summary">
              <p>Articles sélectionnés : {cartSummary.quantity}</p>
              <strong>Total estimé : {cartSummary.total.toFixed(2)} DT</strong>
            </div>

            <div className="commercial-wholesale-form">
              <label className="commercial-client-field">
                <span>Nom / raison sociale</span>
                <input
                  type="text"
                  value={wholesaleCustomer.nom}
                  onChange={(event) => handleWholesaleCustomerChange("nom", event.target.value)}
                  placeholder="Nom du client en gros"
                />
              </label>
              <label className="commercial-client-field">
                <span>Téléphone</span>
                <input
                  type="tel"
                  value={wholesaleCustomer.phone}
                  onChange={(event) => handleWholesaleCustomerChange("phone", event.target.value)}
                  placeholder="+216 ..."
                />
              </label>
              <label className="commercial-client-field">
                <span>Email</span>
                <input
                  type="email"
                  value={wholesaleCustomer.email}
                  onChange={(event) => handleWholesaleCustomerChange("email", event.target.value)}
                  placeholder="client@exemple.com"
                />
              </label>
              <label className="commercial-client-field">
                <span>Localisation</span>
                <input
                  type="text"
                  value={wholesaleCustomer.localisation}
                  onChange={(event) => handleWholesaleCustomerChange("localisation", event.target.value)}
                  placeholder="Ville, quartier..."
                />
              </label>
              <label className="commercial-client-field">
                <span>Commercial référent</span>
                <select
                  value={selectedCommercialId}
                  onChange={(event) => setSelectedCommercialId(event.target.value)}
                >
                  <option value="">Choisissez un commercial</option>
                  {commercialOptions.map((commercial) => (
                    <option key={commercial._id} value={commercial._id}>
                      {commercial.username} ({commercial.email})
                    </option>
                  ))}
                </select>
              </label>

              <div className="commercial-cart-actions">
                <button
                  type="button"
                  className="commercial-btn"
                  onClick={handleCheckout}
                  disabled={!canValidateOrder}
                >
                  {canValidateOrder ? "Valider la commande" : "Informations manquantes"}
                </button>
                {checkoutRequirements.length > 0 && (
                  <p className="commercial-cta-hint">{checkoutRequirements[0]}</p>
                )}
              </div>

              {cartMessage && (
                <p className={`commercial-feedback commercial-feedback-${cartMessageType}`}>{cartMessage}</p>
              )}

              {!isLoggedIn && (
                <div className="commercial-alert commercial-alert-inline">
                  <p>
                    Connectez-vous ou créez un compte pour associer un commercial et finaliser votre commande.
                  </p>
                <button
                  type="button"
                  className="commercial-btn commercial-btn-secondary"
                  onClick={() => navigate("/gros/login")}
                >
                    Se connecter / Créer un compte
                  </button>
                </div>
              )}
            </div>

            {selectedCommercial && (
              <p className="commercial-hint">
                Commercial sélectionné : {selectedCommercial.username} ({selectedCommercial.email})
              </p>
            )}
          </div>
        </div>
      </section>

      <section id="orders" className="commercial-section commercial-orders-section">
        <div className="commercial-section-head">
          <p className="commercial-section-kicker">Demandes</p>
          <h2>Consultez vos commandes</h2>
          <p>
            Retrouvez ici l'historique de vos demandes validées et suivez leur statut une fois traitées.
          </p>
        </div>

        {ordersError && <div className="commercial-alert">{ordersError}</div>}
        {(isGrosClient || userRole === "commercial" || userRole === "admin" || userRole === "super_admin") ? (
          ordersLoading ? (
            <div className="commercial-empty-state">Chargement des commandes...</div>
          ) : orders.length === 0 ? (
            <div className="commercial-empty-state">
              Aucune commande enregistrée pour le moment. Validez une demande depuis le panier.
            </div>
          ) : (
            <div className="commercial-order-grid">
              {orders.map((order) => (
                <article key={order._id} className="commercial-order-card">
                  <div className="commercial-order-meta">
                    <h3>{order.customerName}</h3>
                    <span className="commercial-order-status">{order.status || "pending"}</span>
                  </div>
                  <p className="commercial-order-detail">
                    {order.customerEmail} · {order.customerPhone}
                  </p>
                  {order.customerLocation && (
                    <p className="commercial-order-detail">{order.customerLocation}</p>
                  )}
                  <p className="commercial-order-detail">
                    Commandée par {order.createdBy?.username || order.createdBy?.email || "Utilisateur"} le{" "}
                    {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                  <ul className="commercial-order-items">
                    {order.items.map((item) => (
                      <li key={`${order._id}-${item.productId}`}>
                        {item.quantity} × {item.name} ({item.price} DT / {item.unit})
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )
        ) : (
          <div className="commercial-alert commercial-alert-inline">
            <p>Connectez-vous pour consulter vos demandes en gros.</p>
            <button
              type="button"
              className="commercial-btn commercial-btn-secondary"
              onClick={() => navigate("/gros/login")}
            >
              Login client gros
            </button>
          </div>
        )}
      </section>

    </main>
  );
}

export default GrosPage;
