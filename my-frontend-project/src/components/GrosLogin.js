import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { buildApiUrl } from "../config/api";
import "./Auth.css";

const GrosLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    try {
      const response = await axios.post(buildApiUrl("/users/login"), {
        email: formData.email,
        password: formData.password
      }, { withCredentials: true });
      if (response.data.role !== "user") {
        setMessageType("error");
        setMessage("Cette interface est réservée aux clients commerciaux.");
        return;
      }

      const token = response.data.token;
      localStorage.setItem("token", token);
      localStorage.setItem("name", response.data.username);
      localStorage.setItem("email", response.data.email || "");
      localStorage.setItem("role", response.data.role || "");
      setMessageType("success");
      setMessage("Connexion réussie.");
      navigate("/gros");
    } catch (error) {
      setMessageType("error");
      const serverMsg = error.response?.data?.msg || error.response?.data?.message;
      setMessage(serverMsg || error.message || "Erreur lors de la connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <section className="auth-hero">
          <span className="auth-kicker">Espace clients commerciaux</span>
          <h1>Connexion pour vos achats professionnels</h1>
          <p>
            Ce connecteur est réservé aux clients gros : la consultation reste ouverte mais la
            création de commande ou le suivi de vos demandes exigent simplement que vous
            vous identifiiez avec votre email et mot de passe. Dès que vous êtes connecté, vous
            retrouvez rapidement le catalogue, le panier et vos demandes.
          </p>
          <ul className="auth-feature-list">
            <li>Identité mémorisée pour retrouver vos demandes.</li>
            <li>Connexion rapide via email et mot de passe seuls.</li>
            <li>Choisissez le commercial référent qui traite vos achats.</li>
          </ul>
        </section>

        <section className="auth-panel">
          <div className="auth-form-header">
            <h2>Connexion client gros</h2>
            <p>Entrez votre email et mot de passe pour créer ou suivre vos demandes.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="gros-login-email">Email</label>
              <input
                id="gros-login-email"
                type="email"
                name="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="gros-login-password">Mot de passe</label>
              <input
                id="gros-login-password"
                type="password"
                name="password"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </button>

            {message && (
              <p className={`auth-message ${messageType || "error"}`}>{message}</p>
            )}

            <button
              type="button"
              className="auth-secondary-button"
              onClick={() => navigate("/register?target=gros")}
            >
              Créer un compte client gros
            </button>
          </form>

            <p className="auth-switch">
              Cette page concerne vos achats gros. Besoin d'un accès admin ?{" "}
              <Link to="/login">Utilisez la page admin</Link>.
            </p>
        </section>
      </div>
    </div>
  );
};

export default GrosLogin;
