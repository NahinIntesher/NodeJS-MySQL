const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.cookies.userRegistered;

  if (!token) {
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, "1234");
    req.userId = decoded.id; // Store the user ID in the request object
    next();
  } catch (err) {
    console.error("JWT verification error:", err);
    return res.redirect("/login");
  }
};

module.exports = verifyToken;
