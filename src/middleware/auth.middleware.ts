import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

interface JwtPayload {
  id: string;
  purpose?: string;
}

export const authenticateToken = (requiredPurpose?: string) => {
  return (req: Request & { user?: JwtPayload }, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

      // If a purpose is required, verify it
      if (requiredPurpose && decoded.purpose !== requiredPurpose) {
        return res.status(403).json({ success: false, message: 'Invalid token purpose' });
      }
      console.log("Decoded token:", decoded);

      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ success: false, message: 'Token verification failed' });
    }
  };
};
