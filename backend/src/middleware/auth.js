import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
  try {
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({
          success: false,
          error: "Unauthorized",
          errorType: "AUTH_REQUIRED",
        });
    }
    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res
        .status(500)
        .json({
          success: false,
          error: "Server auth not configured",
          errorType: "AUTH_MISCONFIG",
        });
    }
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (err) {
    return res
      .status(401)
      .json({
        success: false,
        error: "Invalid token",
        errorType: "AUTH_INVALID",
      });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res
      .status(401)
      .json({
        success: false,
        error: "Unauthorized",
        errorType: "AUTH_REQUIRED",
      });
  }
  const isAdmin = req.user.role === "admin" || req.user.admin === true;
  if (!isAdmin) {
    return res
      .status(403)
      .json({ success: false, error: "Forbidden", errorType: "FORBIDDEN" });
  }
  return next();
}
