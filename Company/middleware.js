const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.cookies.userRegistered;

  if (!token) {
    return res.redirect("/loginPage");
  }

  try {
    const decoded = jwt.verify(token, "1234");
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error("JWT verification error:", err);
    return res.redirect("/loginPage");
  }
};

module.exports = verifyToken;
