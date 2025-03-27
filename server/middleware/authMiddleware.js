const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  // Look for the token in the Authorization header in the format 'Bearer <token>'
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.json({
      success: false,
      message: "Not Authorized. Login Again.",
    });
  }

  // Extract the token part after "Bearer "
  const token = authHeader.split(" ")[1];

  try {
    // Verify the token using your JWT secret
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded user data to the request object
    req.user = { id: token_decode._id };

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    return res.json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

module.exports = authMiddleware;