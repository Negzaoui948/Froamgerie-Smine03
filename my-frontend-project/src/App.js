import React from "react";
import Register from "./components/Register";
import Login from "./components/Login"
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./pages/Navbar";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./pages/CheckoutForm";

const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder"
);

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/client/home" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/Login" element={<Login />} />
      <Route path="/login" element={<Navigate to="/Login" replace />} />
      <Route path="/client" element={<Navigate to="/client/home" replace />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

      <Route path="/home" element={<Navigate to="/client/home" replace />} />
      <Route path="/products" element={<Navigate to="/admin/products" replace />} />
      <Route path="/categories" element={<Navigate to="/admin/categories" replace />} />
      <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/client-dashboard" element={<Navigate to="/client/home" replace />} />
      <Route path="/checkout" element={<Navigate to="/client/checkout" replace />} />

      <Route path="/client/home" element={<>
        <Navbar space="client" />
        <Home />
      </>} />

      <Route path="/client/dashboard" element={<Navigate to="/client/home" replace />} />

      <Route path="/client/checkout" element={<>
        <Navbar space="client" />
        <Elements stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      </>} />

      <Route path="/admin/products" element={<Navigate to="/admin/dashboard" replace />} />

      <Route path="/admin/categories" element={<Navigate to="/admin/dashboard" replace />} />

      <Route path="/admin/dashboard" element={<>
        <Navbar space="admin" />
        <AdminDashboard />
      </>} />

      <Route path="*" element={<Navigate to="/client/home" replace />} />
    </Routes>
  );
};

export default App;
