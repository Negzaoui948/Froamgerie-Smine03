// CheckoutForm.js
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useState } from "react";
import { buildApiUrl } from "../config/api";

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(buildApiUrl("/stripe/create-payment-intent"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1000 }),
      });

      const data = await res.json();

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        setMessageType("error");
        setMessage(result.error.message);
      } else if (result.paymentIntent.status === "succeeded") {
        setMessageType("success");
        setMessage("Paiement effectué avec succès ! 🎉");
        elements.getElement(CardElement).clear();
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Une erreur s'est produite : " + error.message);
    }
    setLoading(false);
  };

  // --- Styles Intégrés ---
  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "80vh",
      background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
      padding: "20px",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    card: {
      backgroundColor: "#fff",
      padding: "40px",
      borderRadius: "16px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      width: "100%",
      maxWidth: "400px",
      textAlign: "center",
    },
    title: {
      margin: "0 0 10px 0",
      fontSize: "22px",
      color: "#111827",
    },
    subtitle: {
      color: "#6b7280",
      fontSize: "14px",
      marginBottom: "30px",
    },
    amount: {
      color: "#4f46e5",
      fontWeight: "bold",
      fontSize: "18px",
    },
    inputWrapper: {
      textAlign: "left",
      marginBottom: "20px",
    },
    label: {
      display: "block",
      fontSize: "13px",
      fontWeight: "600",
      color: "#374151",
      marginBottom: "8px",
    },
    cardElementContainer: {
      padding: "12px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      backgroundColor: "#f9fafb",
    },
    button: {
      width: "100%",
      padding: "12px",
      backgroundColor: loading ? "#9ca3af" : "#4f46e5",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: loading ? "not-allowed" : "pointer",
      transition: "background-color 0.2s",
      marginTop: "10px",
    },
    message: {
      padding: "10px",
      borderRadius: "6px",
      marginBottom: "15px",
      fontSize: "14px",
      backgroundColor: messageType === "success" ? "#ecfdf5" : "#fef2f2",
      color: messageType === "success" ? "#065f46" : "#991b1b",
      border: `1px solid ${messageType === "success" ? "#a7f3d0" : "#fecaca"}`,
    },
    security: {
      marginTop: "20px",
      fontSize: "12px",
      color: "#9ca3af",
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Finaliser l'achat</h2>
        <p style={styles.subtitle}>
          Montant à régler : <span style={styles.amount}>10,00 $</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div style={styles.inputWrapper}>
            <label style={styles.label}>Informations de paiement</label>
            <div style={styles.cardElementContainer}>
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#1f2937",
                      "::placeholder": { color: "#9ca3af" },
                    },
                    invalid: { color: "#ef4444" },
                  },
                }}
              />
            </div>
          </div>

          {message && <div style={styles.message}>{message}</div>}

          <button type="submit" disabled={!stripe || loading} style={styles.button}>
            {loading ? "Traitement en cours..." : "Payer maintenant"}
          </button>
        </form>

        <p style={styles.security}>
          🔒 Paiement sécurisé via Stripe
        </p>
      </div>
    </div>
  );
}

export default CheckoutForm;
