import { Request, Response, NextFunction } from "express";
import { authenticateToken } from "../services/auth.service";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: "MARKETER" | "REVIEWER";
  };
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      code: "UNAUTHENTICATED",
      message: "Authentication required."
    });
  }

  const token = header.slice(7);
  const user = authenticateToken(token);

  if (!user) {
    return res.status(401).json({
      success: false,
      code: "UNAUTHENTICATED",
      message: "Session is invalid or expired."
    });
  }

  req.user = user;
  next();
}

export function requireRole(role: "MARKETER" | "REVIEWER") {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN_ROLE",
        message: `This action requires the ${role} role.`
      });
    }

    next();
  };
}
