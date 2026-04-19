import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { buildApiUrl } from "../config/api";
import "./Auth.css";

const CommercialLogin = () => {
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
      const response = await axios.post(
        buildApiUrl("/users/login"),
        {
          email: formData.email,
          password: formData.password
        },
        { withCredentials: true }
      );
      if (response.data.role !== "commercial") {
        setMessageType("error");
        setMessage("Cette interface est réservée aux commerciaux.");
        return;
      }

      const token = response.data.token;
      localStorage.setItem("token", token);
      localStorage.setItem("name", response.data.username);
      localStorage.setItem("email", response.data.email || "");
      localStorage.setItem("role", response.data.role || "");
      setMessageType("success");
      setMessage("Connexion réussie.");
      navigate("/admin/dashboard#orders");
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
          <span className="auth-kicker">Espace commerciaux</span>
          <h1>Connexion pour les commerciaux</h1>
          <p>
            Identifiez-vous en renseignant votre email et mot de passe pour accéder uniquement aux
            commandes qui portent votre nom.
          </p>
          <ul className="auth-feature-list">
            <li>Commandes filtrées par votre profil</li>
            <li>Suivi du statut des demandes clients</li>
            <li>Bouton « Consulter mes commandes » sur le dashboard</li>
          </ul>
        </section>

        <section className="auth-panel">
          <div className="auth-form-header">
            <h2>Connexion commercial</h2>
            <p>Email et mot de passe sont suffisants pour vous connecter.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="commercial-login-email">Email</label>
              <input
                id="commercial-login-email"
                type="email"
                name="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="commercial-login-password">Mot de passe</label>
              <input
                id="commercial-login-password"
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
              onClick={() => navigate("/register?target=commercial")}
            >
              Créer un compte commercial
            </button>
          </form>

          <p className="auth-switch">
            Vous êtes un client gros ? <Link to="/gros/login">Accédez à votre espace</Link>.
          </p>
          <p className="auth-switch">
            Vous êtes un administrateur ? <Link to="/login">Utilisez l’espace admin</Link>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default CommercialLogin;
