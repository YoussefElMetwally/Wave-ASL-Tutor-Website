const jwt = require("jsonwebtoken");

exports.checkLogin = (req, res, next) => {
  if (JSON.stringify(req.cookies) == "{}") {
    return res.redirect("/views/login");
  }
  next();
};

exports.getIdFromCookie = (req, res) => {
  const token = req.cookies.User;
  if (!token) return null;
  const payload = jwt.decode(token);
  return payload?.id || null;
};

exports.logout = (req, res) => {
  res.clearCookie("User");
};
