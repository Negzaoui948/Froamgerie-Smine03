import React, { useState } from "react";
import "./Auth.css";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import axios from "axios";
import { buildApiUrl } from "../config/api";

const Login = () => {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage("");

        try {
            const res = await axios.post(buildApiUrl("/users/login"), formData);
            setMessageType("success");
            setMessage(res.data.msg);
            if (res.data.token) {
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("name", res.data.username);
                localStorage.setItem("email", res.data.email || "");
                localStorage.setItem("role", res.data.role || "");
                navigate("/admin/dashboard");
            }
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
                    <span className="auth-kicker">Espace membre</span>
                    <h1>Connectez-vous et reprenez la main sur votre espace.</h1>
                    <p>
                        Retrouvez vos produits, vos categories et votre tableau de bord dans une
                        interface plus claire, plus moderne et plus agreable a utiliser.
                    </p>
                    <ul className="auth-feature-list">
                        <li>Acces rapide a votre tableau de bord</li>
                        <li>Navigation simple et rassurante</li>
                        <li>Design responsive pour mobile et desktop</li>
                    </ul>
                </section>

                <section className="auth-panel">
                    <div className="auth-form-header">
                        <h2>Connexion</h2>
                        <p>Entrez vos informations pour acceder a votre compte.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-field">
                            <label htmlFor="login-email">Email</label>
                            <input
                                id="login-email"
                                type="email"
                                name="email"
                                placeholder="vous@exemple.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="login-password">Mot de passe</label>
                            <input
                                id="login-password"
                                type="password"
                                name="password"
                                placeholder="Votre mot de passe"
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
                    </form>

                    <p className="auth-switch">
                        Pas encore de compte ? <Link to="/">Creer un compte</Link>
                    </p>
                </section>
            </div>
        </div>
    );
};
export default Login;
