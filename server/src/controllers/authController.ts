import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/db';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this-in-production';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, mobile } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser && existingUser.customerType === 'ACCOUNT') {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let user;
    if (existingUser && existingUser.customerType === 'GUEST') {
      // Transition guest to account
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: name || existingUser.name,
          passwordHash,
          mobile: mobile || existingUser.mobile,
          customerType: 'ACCOUNT',
          emailVerified: true,
          emailVerifiedAt: new Date()
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          normalizedEmail,
          passwordHash,
          mobile,
          role: 'CUSTOMER',
          customerType: 'ACCOUNT',
          emailVerified: false
        }
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    
    if (!user) {
      return res.status(200).json({ success: true, message: 'If the email exists, a reset link was sent.' });
    }

    const token = 'simulated-reset-token-12345';
    
    res.json({
      success: true,
      message: 'Password reset link has been simulated.',
      token
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user?.id },
      select: {
        id: true,
        customerCode: true,
        name: true,
        email: true,
        mobile: true,
        profileImage: true,
        role: true,
        emailVerified: true,
        customerType: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { name, mobile, profileImage } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(mobile !== undefined && { mobile: mobile ? String(mobile).trim() : null }),
        ...(profileImage !== undefined && { profileImage })
      },
      select: {
        id: true,
        customerCode: true,
        name: true,
        email: true,
        mobile: true,
        profileImage: true,
        role: true,
        emailVerified: true,
        customerType: true
      }
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
