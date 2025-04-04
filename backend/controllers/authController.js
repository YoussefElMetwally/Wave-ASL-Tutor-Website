const jwt = require("jsonwebtoken");

// exports.checkLogin = (req, res, next) => {
//   if (JSON.stringify(req.cookies) == "{}") {
//     return res.redirect("/views/login");
//   }
//   next();
// };

exports.checkLogin = (req, res, next) => {
  try {
    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, "verySecretValue", (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
      }
      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(401).json({ message: "Authentication failed" });
  }
};

exports.getIdFromCookie = (req, res) => {
  const token = req.cookies.User;
  if (!token) return null;
  const payload = jwt.decode(token);
  return payload?.id || null;
};

exports.logout = (req, res) => {
  res.clearCookie("User");
  res.json({ message: "Logged out successfully" });
};
