const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * protect – verifies the JWT attached to the Authorization header.
 * Attaches the decoded user document to req.user.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorised – no token." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Token invalid or expired." });
  }
};

/**
 * authorise – restricts access to specified roles.
 * Usage: router.get("/admin-only", protect, authorise("admin"), handler)
 */
const authorise = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not permitted to access this resource.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorise };
