const router = require("express").Router();
const authMiddleware = require("../../middleware/authMiddleware");
const Order = require("../../models/Order");
const User = require("../../models/User");

const normalizeRole = (role) => String(role || "").toLowerCase();
const isAdminRole = (role) => ["admin", "super_admin"].includes(normalizeRole(role));
const isGrosClientRole = (role) => ["user", "commercial"].includes(normalizeRole(role));

const sanitizeOrderItems = (items = []) =>
  items.map((item) => ({
    productId: item.productId,
    name: item.name,
    quantity: Number(item.quantity),
    price: Number(item.price),
    unit: item.unit
  }));
const VALID_ORDER_STATUSES = ["pending", "confirmed", "cancelled"];

const buildOrder = async ({
  customerName,
  customerEmail,
  customerPhone,
  customerLocation,
  commercialId,
  items,
  comment,
  createdById
}) => {
  const commercial = await User.findById(commercialId);
  if (!commercial || commercial.role !== "commercial") {
    const error = new Error("Commercial introuvable.");
    error.status = 404;
    throw error;
  }

  const sanitizedItems = sanitizeOrderItems(items);
  
  const newOrder = new Order({
    customerName,
    customerEmail,
    customerPhone,
    customerLocation: customerLocation || "",
    commercial: commercial._id,
    createdBy: createdById,
    items: sanitizedItems,
    comment: comment || ""
  });

  const savedOrder = await newOrder.save();
  
  // Populate après save 
  const populatedOrder = await Order.findById(savedOrder._id)
    .populate("commercial", "username email")
    .populate("createdBy", "username email");
  
  return populatedOrder;
};

const validateOrderPayload = (payload) => {
  const { customerName, customerEmail, customerPhone, commercialId, items } = payload;
  if (!customerName || !customerEmail || !customerPhone || !commercialId || !Array.isArray(items) || items.length === 0) {
    return false;
  }
  return true;
};

router.post("/", authMiddleware, async (req, res) => {
  if (!isAdminRole(req.user.role)) {
    return res.status(403).json({ status: "forbidden", msg: "Accès réservé aux administrateurs." });
  }

  if (!validateOrderPayload(req.body)) {
    return res.status(400).json({
      status: "notok",
      msg: "Veuillez renseigner le nom, l'email, le téléphone, un commercial et au moins un article."
    });
  }

  try {
    const order = await buildOrder({
      ...req.body,
      createdById: req.user.id
    });
    return res.status(201).json({ status: "ok", order });
  } catch (err) {
    console.error("Erreur creation commande:", err);
    if (err.status === 404) {
      return res.status(404).json({ status: "notok", msg: err.message });
    }
    return res.status(500).json({ 
      status: "error", 
      msg: "Erreur serveur lors de la commande.",
      details: err.message 
    });
  }
});

router.post("/client", authMiddleware, async (req, res) => {
  if (!isGrosClientRole(req.user.role)) {
    return res.status(403).json({ status: "forbidden", msg: "Accès réservé aux clients gros." });
  }

  if (!validateOrderPayload(req.body)) {
    return res.status(400).json({
      status: "notok",
      msg: "Veuillez renseigner le nom, l'email, le téléphone, un commercial et au moins un article."
    });
  }

  try {
    const order = await buildOrder({
      ...req.body,
      createdById: req.user.id
    });
    return res.status(201).json({ status: "ok", order });
  } catch (err) {
    console.error("Erreur creation commande client gros:", err);
    if (err.status === 404) {
      return res.status(404).json({ status: "notok", msg: err.message });
    }
    return res.status(500).json({ 
      status: "error", 
      msg: "Erreur serveur lors de la commande.",
      details: err.message 
    });
  }
});

router.get("/commercial", authMiddleware, async (req, res) => {
  if (normalizeRole(req.user.role) !== "commercial") {
    return res.status(403).json({ status: "forbidden", msg: "Accès réservé aux commerciaux." });
  }

  try {
    const orders = await Order.find({ commercial: req.user.id })
      .populate("commercial", "username email")
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 });
    return res.status(200).json({ status: "ok", orders });
  } catch (err) {
    console.error("Erreur recuperation commandes commerciales:", err);
    return res.status(500).json({ status: "error", msg: "Erreur lors de la lecture des commandes." });
  }
});

router.get("/client", authMiddleware, async (req, res) => {
  const role = normalizeRole(req.user.role);
  if (!["user", "commercial", "admin", "super_admin"].includes(role)) {
    return res.status(403).json({ status: "forbidden", msg: "Accès réservé aux membres autorisés." });
  }

  try {
    let filter = {};
    if (isAdminRole(role)) {
      filter = {};
    } else if (role === "commercial") {
      filter = { commercial: req.user.id };
    } else {
      filter = { createdBy: req.user.id };
    }

    const orders = await Order.find(filter)
      .populate("commercial", "username email")
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ status: "ok", orders });
  } catch (err) {
    console.error("Erreur récupération commandes:", err);
    return res.status(500).json({ status: "error", msg: "Erreur lors de la lecture des commandes." });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  if (!isAdminRole(req.user.role)) {
    return res.status(403).json({ status: "forbidden", msg: "Accès interdit." });
  }

  try {
    const orders = await Order.find()
      .populate("commercial", "username email")
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 });
    return res.status(200).json({ status: "ok", orders });
  } catch (err) {
    console.error("Erreur recuperation commandes:", err);
    return res.status(500).json({ status: "error", msg: "Erreur lors de la lecture des commandes." });
  }
});

router.patch("/:id/status", authMiddleware, async (req, res) => {
  if (!isAdminRole(req.user.role)) {
    return res.status(403).json({ status: "forbidden", msg: "Accès interdit." });
  }

  const { status } = req.body;
  if (!status || !VALID_ORDER_STATUSES.includes(status)) {
    return res.status(400).json({
      status: "notok",
      msg: "Statut invalide."
    });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: "notok", msg: "Commande non trouvee." });
    }

    order.status = status;
    await order.save();
    const populatedOrder = await Order.findById(order._id)
      .populate("commercial", "username email")
      .populate("createdBy", "username email");

    return res.status(200).json({
      status: "ok",
      msg: "Statut mis a jour.",
      order: populatedOrder
    });
  } catch (err) {
    console.error("Erreur mise a jour statut commande:", err);
    return res.status(500).json({
      status: "error",
      msg: "Erreur serveur lors de la mise a jour du statut."
    });
  }
});

module.exports = router;
