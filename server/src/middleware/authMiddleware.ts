import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this-in-production';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Support both cookie and Bearer token for backward compatibility during transition if needed
  let token = req.cookies?.token;
  
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token && req.query?.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const optionalAuthenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token = req.cookies?.token;
  
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token && req.query?.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
    } catch {
      // Ignore invalid or expired token for optional auth
    }
  }
  next();
};


import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    const userRole = String(req.user.role || '').toLowerCase().replace(/_/g, ' ').trim();
    const rawUserRole = String(req.user.role || '').toLowerCase().trim();

    // Normalize target roles
    const normalizedRoles = roles.map(r => r.toLowerCase().replace(/_/g, ' ').trim());
    if (normalizedRoles.includes('admin') && !normalizedRoles.includes('super admin')) {
      normalizedRoles.push('super admin');
    }

    const isAuthorized = normalizedRoles.some(
      r => r === userRole || r === rawUserRole || roles.includes(req.user!.role)
    );

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this route' });
    }
    
    next();
  };
};

export const requirePermission = (requiredPermission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next(); // SUPER_ADMIN always bypasses permission checks
    }

    try {
      const role = await prisma.role.findUnique({
        where: { name: req.user.role },
        select: { permissions: true }
      });

      if (!role) {
        return res.status(403).json({ success: false, message: 'Role not found' });
      }

      const permissions: string[] = JSON.parse(role.permissions);
      
      if (!permissions.includes('all') && !permissions.includes(requiredPermission)) {
        return res.status(403).json({ success: false, message: 'You do not have permission to perform this action' });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ success: false, message: 'Internal server error checking permissions' });
    }
  };
};
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Allow safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Bearer token requests are naturally protected against CSRF
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return next();
  }

  // Check Origin or Referer or custom headers or API calls
  const requestedWith = req.headers['x-requested-with'];
  const contentType = req.headers['content-type'];
  const origin = req.headers['origin'];
  const referer = req.headers['referer'];

  // If request has origin, referer, x-requested-with, or standard API content type, allow it
  if (
    requestedWith === 'XMLHttpRequest' ||
    origin ||
    referer ||
    (contentType && (contentType.includes('application/json') || contentType.includes('multipart/form-data') || contentType.includes('x-www-form-urlencoded'))) ||
    req.path.startsWith('/api/')
  ) {
    return next();
  }

  return res.status(403).json({ success: false, message: 'CSRF validation failed' });
};
