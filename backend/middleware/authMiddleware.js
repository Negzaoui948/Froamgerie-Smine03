const jwt = require("jsonwebtoken");
const config = require("config");
const User = require("../models/User");

const parseCookies = (cookieHeader = "") =>
  cookieHeader.split(";").reduce((cookies, cookie) => {
    const [name, ...rest] = cookie.split("=");
    if (!name) return cookies;
    cookies[name.trim()] = decodeURIComponent(rest.join("=").trim());
    return cookies;
  }, {});

const authMiddleware = async (req, res, next) => {
  const JWT_SECRET = process.env.JWT_SECRET || config.get("jwtSecret");

  const headerToken = req.headers.authorization?.split(" ")[1];
  const cookies = parseCookies(req.headers.cookie || "");
  const token = headerToken || cookies.auth_token;

  console.log("[authMiddleware] Checking token...");
  console.log("[authMiddleware] headerToken:", headerToken ? "present" : "missing");
  console.log("[authMiddleware] cookies.auth_token:", cookies.auth_token ? "present" : "missing");
  console.log("[authMiddleware] final token:", token ? "present" : "missing");

  if (!token) {
    console.log("[authMiddleware] No token provided");
    return res.status(401).json({ message: "Accès refusé. Aucun token fourni.", status: "notok" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("[authMiddleware] Token verified successfully:", { id: decoded.id, role: decoded.role });

    let userInfo = decoded;
    if (!decoded.role && decoded.id) {
      const user = await User.findById(decoded.id).select("role email username");
      if (user) {
        userInfo = {
          ...decoded,
          role: user.role,
          email: user.email,
          name: user.username
        };
      }
    }

    req.user = userInfo;
    next();
  } catch (err) {
    console.error("[authMiddleware] Token verification failed:", err.message);
    res.status(401).json({ message: "Token invalide.", status: "notok", error: err.message });
  }
};

module.exports = authMiddleware;
