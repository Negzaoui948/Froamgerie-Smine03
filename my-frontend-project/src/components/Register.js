import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Auth.css";
import { buildApiUrl } from "../config/api";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await axios.post(
        buildApiUrl("/users/register"),
        formData
      );
      setMessageType("success");
      setMessage(response.data.msg);
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.msg || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <section className="auth-hero">
          <span className="auth-kicker">Nouvelle inscription</span>
          <h1>Creez votre compte et lancez votre espace en quelques secondes.</h1>
          <p>
            Commencez avec une experience plus soignee, une meilleure lisibilite et
            un formulaire pense pour inspirer confiance des le premier ecran.
          </p>
          <ul className="auth-feature-list">
            <li>Creation de compte simple et guidee</li>
            <li>Interface nette avec hierarchy visuelle claire</li>
            <li>Compatible mobile sans perte de confort</li>
          </ul>
        </section>

        <section className="auth-panel">
          <div className="auth-form-header">
            <h2>Inscription</h2>
            <p>Renseignez vos informations pour creer votre compte.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="register-username">Nom d'utilisateur</label>
              <input
                id="register-username"
                type="text"
                name="username"
                placeholder="Votre nom d'utilisateur"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">Email</label>
              <input
                id="register-email"
                type="email"
                name="email"
                placeholder="vous@exemple.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">Mot de passe</label>
              <input
                id="register-password"
                type="password"
                name="password"
                placeholder="Choisissez un mot de passe"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? "Inscription..." : "S'inscrire"}
            </button>

            {message && (
              <p className={`auth-message ${messageType || "error"}`}>
                {message}
              </p>
            )}
          </form>

          <p className="auth-switch">
            Vous avez deja un compte ? <Link to="/Login">Se connecter</Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Register;
