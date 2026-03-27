import React, { useMemo, useState } from "react";
import axios from "axios";
import CategoryManager from "./CategoryManager";
import ProductManager from "./ProductManager";
import { buildApiUrl } from "../config/api";
import "./AdminDashboard.css";

const SUPER_ADMIN_EMAILS = [
  "oussama.negzaoui24@gmail.com",
  "abir@gmail.com"
];

const panels = [
  {
    id: "categories",
    label: "Gerer categories",
    title: "Gestion des categories",
    description: "Ajoutez, modifiez et supprimez les categories."
  },
  {
    id: "products",
    label: "Gerer produits",
    title: "Gestion des produits",
    description: "Administrez le catalogue produit depuis ce panneau."
  },
  {
    id: "admin",
    label: "Creer un admin",
    title: "Creer un nouvel administrateur",
    description: "Ajoutez un nouveau compte admin rapidement."
  },
  {
    id: "video",
    label: "Modifier la video",
    title: "Modifier la video de la page client",
    description: "Definissez l'URL de la video hero affichee sur la page client."
  }
];

function AdminDashboard() {
  const currentAdminEmail = localStorage.getItem("email") || "";
  const canCreateAdmin = SUPER_ADMIN_EMAILS.includes(currentAdminEmail);
  const [activePanel, setActivePanel] = useState("");
  const [adminForm, setAdminForm] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [adminMessage, setAdminMessage] = useState({ text: "", type: "" });
  const [heroMedia, setHeroMedia] = useState(() => {
    const savedMedia = localStorage.getItem("clientHeroMedia");
    return savedMedia ? JSON.parse(savedMedia) : null;
  });
  const [videoMessage, setVideoMessage] = useState("");
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  const activeConfig = useMemo(
    () => panels.find((panel) => panel.id === activePanel),
    [activePanel]
  );

  const handleCreateAdmin = async (event) => {
    event.preventDefault();
    setIsSubmittingAdmin(true);
    setAdminMessage({ text: "", type: "" });

    try {
      if (!canCreateAdmin) {
        setAdminMessage({
          text: "Seuls les super admins peuvent ajouter d'autres admins.",
          type: "error"
        });
        return;
      }

      const response = await axios.post(
        buildApiUrl("/users/register"),
        {
          ...adminForm,
          role: "admin"
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        }
      );

      setAdminMessage({
        text: response.data.msg || "Nouvel administrateur cree avec succes.",
        type: "success"
      });
      setAdminForm({ username: "", email: "", password: "" });
    } catch (error) {
      setAdminMessage({
        text: error.response?.data?.msg || "Impossible de creer le nouvel administrateur.",
        type: "error"
      });
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleSaveVideo = (event) => {
    event.preventDefault();
  };

  const handleMediaSelection = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      setVideoMessage("Selectionnez uniquement une image ou une video.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextMedia = {
        kind: isVideo ? "video" : "image",
        src: reader.result,
        name: file.name
      };

      setHeroMedia(nextMedia);
      localStorage.setItem("clientHeroMedia", JSON.stringify(nextMedia));
      localStorage.removeItem("clientHeroVideo");
      setVideoMessage("Le visuel de la page client a ete mis a jour.");
    };
    reader.readAsDataURL(file);
  };

  const renderPanelContent = () => {
    if (activePanel === "categories") {
      return <CategoryManager />;
    }

    if (activePanel === "products") {
      return <ProductManager />;
    }

    if (activePanel === "admin") {
      if (!canCreateAdmin) {
        return (
          <div className="admin-simple-card">
            <p className="admin-feedback admin-feedback-error">
              Seuls les super admins peuvent ajouter d'autres admins.
            </p>
          </div>
        );
      }

      return (
        <div className="admin-simple-card">
          <form className="admin-form-grid" onSubmit={handleCreateAdmin}>
            <label className="admin-form-field">
              <span>Nom d'utilisateur</span>
              <input
                type="text"
                value={adminForm.username}
                onChange={(event) =>
                  setAdminForm({ ...adminForm, username: event.target.value })
                }
                required
              />
            </label>

            <label className="admin-form-field">
              <span>Email</span>
              <input
                type="email"
                value={adminForm.email}
                onChange={(event) =>
                  setAdminForm({ ...adminForm, email: event.target.value })
                }
                required
              />
            </label>

            <label className="admin-form-field">
              <span>Mot de passe</span>
              <input
                type="password"
                value={adminForm.password}
                onChange={(event) =>
                  setAdminForm({ ...adminForm, password: event.target.value })
                }
                required
              />
            </label>

            <button className="admin-primary-button" type="submit" disabled={isSubmittingAdmin}>
              {isSubmittingAdmin ? "Creation..." : "Creer le nouvel admin"}
            </button>
          </form>

          {adminMessage.text && (
            <p className={`admin-feedback admin-feedback-${adminMessage.type}`}>
              {adminMessage.text}
            </p>
          )}
        </div>
      );
    }

    if (activePanel === "video") {
      return (
        <div className="admin-simple-card">
          <form className="admin-form-grid" onSubmit={handleSaveVideo}>
            <label className="admin-form-field">
              <span>Choisir une image ou une video</span>
              <input type="file" accept="image/*,video/*" onChange={handleMediaSelection} />
            </label>

            <div className="admin-inline-actions">
              <button className="admin-primary-button" type="submit">
                Garder ce fichier
              </button>
              <button
                className="admin-secondary-button"
                type="button"
                onClick={() => {
                  setHeroMedia(null);
                  localStorage.removeItem("clientHeroMedia");
                  localStorage.removeItem("clientHeroVideo");
                  setVideoMessage("Le visuel personnalise a ete retire.");
                }}
              >
                Reinitialiser
              </button>
            </div>
          </form>

          {heroMedia && (
            <div className="admin-media-preview">
              <p className="admin-hint">Fichier actuel: {heroMedia.name}</p>
              {heroMedia.kind === "video" ? (
                <video className="admin-preview-box" src={heroMedia.src} controls />
              ) : (
                <img className="admin-preview-box" src={heroMedia.src} alt={heroMedia.name} />
              )}
            </div>
          )}

          <p className="admin-hint">
            Astuce: si aucun fichier n'est defini, la page client garde son fond visuel par defaut.
          </p>

          {videoMessage && <p className="admin-feedback admin-feedback-success">{videoMessage}</p>}
        </div>
      );
    }

    return (
      <div className="admin-empty-state">
        <p>Choisissez une action pour commencer.</p>
      </div>
    );
  };

  return (
    <main className="admin-dashboard-page">
      <section className="admin-simple-hero">
        <div className="admin-simple-hero-content">
          <p className="admin-kicker">Espace admin</p>
          <h1>Administration simple et rapide</h1>
          <p>
            Utilisez les boutons ci-dessous pour gerer les categories, les produits,
            creer un admin ou modifier la video de la page client.
          </p>
        </div>
      </section>

      <section className="admin-actions-wrapper">
        <div className="admin-action-grid">
          {panels
            .filter((panel) => canCreateAdmin || panel.id !== "admin")
            .map((panel) => (
            <button
              key={panel.id}
              type="button"
              className={`admin-action-button${activePanel === panel.id ? " is-active" : ""}`}
              onClick={() => setActivePanel(panel.id)}
            >
              <strong>{panel.label}</strong>
              <span>{panel.description}</span>
            </button>
          ))}
        </div>

        <section className="admin-content-panel">
          <div className="admin-content-header">
            <h2>{activeConfig?.title || "Actions disponibles"}</h2>
            <p>
              {activeConfig?.description ||
                "Selectionnez un bouton pour ouvrir le panneau correspondant."}
            </p>
          </div>

          <div className="admin-content-body">{renderPanelContent()}</div>
        </section>
      </section>
    </main>
  );
}

export default AdminDashboard;
