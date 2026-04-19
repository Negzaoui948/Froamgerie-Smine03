import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Home.css";

function SocialIcon({ type }) {
  if (type === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="social-icon-svg">
        <path
          fill="currentColor"
          d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.6-1.6h1.7V4.8c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.2V11H8v3h2.4v8h3.1Z"
        />
      </svg>
    );
  }

  if (type === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="social-icon-svg">
        <path
          fill="currentColor"
          d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm0 1.8A2.7 2.7 0 0 0 4.8 7.5v9a2.7 2.7 0 0 0 2.7 2.7h9a2.7 2.7 0 0 0 2.7-2.7v-9a2.7 2.7 0 0 0-2.7-2.7h-9Zm9.45 1.35a1.05 1.05 0 1 1 0 2.1 1.05 1.05 0 0 1 0-2.1ZM12 7.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 1.8A2.7 2.7 0 1 0 14.7 12 2.7 2.7 0 0 0 12 9.3Z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="social-icon-svg">
      <path
        fill="currentColor"
        d="M19.05 4.94A9.94 9.94 0 0 0 3 12a9.88 9.88 0 0 0 1.35 4.99L3 21l4.14-1.3A9.94 9.94 0 1 0 19.05 4.94ZM12 20.1a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-2.46.77.8-2.4-.2-.32A8.1 8.1 0 1 1 12 20.1Zm4.45-6.03c-.24-.12-1.4-.69-1.62-.77-.22-.08-.38-.12-.54.12s-.61.77-.74.93c-.14.16-.28.18-.52.06a6.54 6.54 0 0 1-1.92-1.19 7.27 7.27 0 0 1-1.34-1.67c-.14-.24 0-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3s-.84.82-.84 2 .86 2.32.98 2.48c.12.16 1.68 2.56 4.07 3.58.57.25 1.02.4 1.37.5.58.19 1.1.16 1.52.1.46-.07 1.4-.57 1.6-1.12.2-.55.2-1.03.14-1.13-.06-.1-.22-.16-.46-.28Z"
      />
    </svg>
  );
}

function Navbar({ space }) {
  const navigate = useNavigate();
  const location = useLocation();
  const name = localStorage.getItem("name");
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");
  const [menuOpen, setMenuOpen] = useState(false);
  const whatsappUrl = "https://wa.me/21620344677";

  const currentSpace =
    space ||
    (location.pathname.startsWith("/admin")
      ? "admin"
      : location.pathname.startsWith("/gros")
        ? "gros"
        : "client");
  const isAdminSpace = currentSpace === "admin";
  const isGrosSpace = currentSpace === "gros";
  const isClientSpace = currentSpace === "client";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    navigate("/login");
  };

  const handleMenuClick = (callback) => {
    callback();
    setMenuOpen(false);
  };

  const openExternalLink = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
    setMenuOpen(false);
  };

  const brandTarget = isAdminSpace
    ? "/admin/dashboard"
    : isGrosSpace
      ? "/gros"
      : "/client/home";
  const brandLabel = isAdminSpace ? "Espace Admin" : isGrosSpace ? "Vente en gros" : "Fromagerie Smine";
  const showGrosLinkInClientMenu = isClientSpace && location.pathname !== "/client/home";
  const showClientDashboardLink = isClientSpace && location.pathname !== "/client/home";
  const links = isAdminSpace
    ? [
        { label: "Gestion Admin", to: "/admin/dashboard" },
        { label: "Espace Client", to: "/client/dashboard" }
      ]
    : isGrosSpace
      ? [
          { label: "Catalogue", sectionId: "products", sectionPath: "/gros" },
          { label: "Panier", sectionId: "cart", sectionPath: "/gros" }
        ]
      : [
          ...(showClientDashboardLink ? [{ label: "Espace Client", to: "/client/dashboard" }] : []),
          { label: "Contactez-nous", sectionId: "contact", sectionPath: "/client/home" },
          ...(showGrosLinkInClientMenu ? [{ label: "Vente en gros", to: "/gros" }] : [])
        ];
  const socialLinks =
    isClientSpace || isGrosSpace
      ? [
          {
            label: "Facebook",
            type: "facebook",
            external: "https://www.facebook.com/fromagerie.smine.nabeul?locale=fr_FR"
          },
          {
            label: "Instagram",
            type: "instagram",
            external: "https://www.instagram.com/fromagerie.smine/"
          },
          {
            label: "WhatsApp",
            type: "whatsapp",
            external: whatsappUrl
          }
        ]
      : [];
  const sectionPaths = {
    client: "/client/home",
    gros: "/gros"
  };

  const scrollToSection = (link) => {
    const targetPath = link.sectionPath || sectionPaths[link.sectionSpace] || sectionPaths[currentSpace] || "/client/home";
    navigate(`${targetPath}#${link.sectionId}`);
  };

  const goToLogin = () => {
    navigate("/login");
  };

  const goToGrosCart = () => {
    navigate("/gros#cart");
  };

  const goToGrosOrders = () => {
    navigate("/gros#orders");
  };

  const openLoginPage = () => {
    goToLogin();
  };

  if (isGrosSpace) {
    return (
      <header className="site-navbar gros-navbar">
        <button className="navbar-brand" type="button" onClick={() => navigate("/gros")}>
          <img
            src="/logo192.png"
            alt="Fromagerie Smine"
            className="navbar-brand-logo"
          />
          <span>{brandLabel}</span>
        </button>
        <div className="gros-navbar-actions">
          <button
            type="button"
            className="social-icon-button"
            aria-label="Panier"
            title="Panier"
            onClick={goToGrosCart}
          >
            <CartIcon />
          </button>
          <button type="button" className="navbar-space-link" onClick={goToGrosOrders}>
            Mes demandes
          </button>
          <button
            type="button"
            className="navbar-space-link navbar-space-link-secondary"
            onClick={goToLogin}
          >
            Login
          </button>
          <div className="social-links-group">
            {socialLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                className="social-icon-button"
                aria-label={link.label}
                title={link.label}
                onClick={() => openExternalLink(link.external)}
              >
                <SocialIcon type={link.type} />
              </button>
            ))}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="site-navbar">
      <button className="navbar-brand" type="button" onClick={() => navigate(brandTarget)}>
        <img
          src="/logo192.png"
          alt="Fromagerie Smine"
          className="navbar-brand-logo"
        />
        <span>{brandLabel}</span>
      </button>

      <div className="navbar-actions">
        <span className="navbar-greeting">
          {isAdminSpace
            ? `Bienvenue, ${name || "admin"} !`
            : isGrosSpace
              ? "Vente en gros - Connexion clients"
              : "Bienvenue a Fromagerie Smine"}
        </span>
        {isClientSpace && (userRole === "admin" || userRole === "super_admin") && (
          <button
            type="button"
            className="navbar-space-link"
            onClick={() => navigate("/admin/dashboard")}
          >
            Admin Dashboard
          </button>
        )}

        {(isGrosSpace || (isClientSpace && location.pathname !== "/client/home")) && !token && (
          <button
            type="button"
            className="navbar-space-link navbar-space-link-secondary"
            onClick={openLoginPage}
          >
            Login
          </button>
        )}

        {socialLinks.length > 0 && (
          <div className="social-links-group">
            {socialLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                className="social-icon-button"
                aria-label={link.label}
                title={link.label}
                onClick={() => openExternalLink(link.external)}
              >
                <SocialIcon type={link.type} />
              </button>
            ))}
          </div>
        )}
        <button
          className="navbar-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          type="button"
          aria-label="Ouvrir le menu"
        >
          Menu
        </button>

        {menuOpen && (
          <div className="navbar-dropdown">
            {links.map((link) => (
              <button
                key={link.to || link.external || link.sectionId || link.label}
                className="nav-link"
                onClick={() => {
                  if (link.external) {
                    openExternalLink(link.external);
                    return;
                  }

                  if (link.sectionId) {
                    handleMenuClick(() => scrollToSection(link));
                    return;
                  }

                  handleMenuClick(() => navigate(link.to));
                }}
                type="button"
              >
                {link.label}
              </button>
            ))}
            {token ? (
              <button
                className="nav-link logout-link"
                onClick={() => handleMenuClick(handleLogout)}
                type="button"
              >
                Logout
              </button>
            ) : (
              <div className="navbar-dropdown-logins">
                {(isClientSpace || isGrosSpace) && (
                  <button
                    className="nav-link"
                    onClick={() => handleMenuClick(openLoginPage)}
                    type="button"
                  >
                    Login
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="social-icon-svg">
      <path
        fill="currentColor"
        d="M8 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-9.7-3.2h10.9c.7 0 1.3-.4 1.5-1l2.2-6.3a.8.8 0 0 0-.8-1.1H6.2L5.6 3.8A1.6 1.6 0 0 0 4 2.6H2.8a.8.8 0 0 0 0 1.6H4l2.4 10.1a1.6 1.6 0 0 0 1.6 1.3Z"
      />
    </svg>
  );
}

export default Navbar;
