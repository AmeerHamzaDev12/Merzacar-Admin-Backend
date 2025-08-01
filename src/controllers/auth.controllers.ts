// NOTE: This is the improved version of your auth.controller with Zod validation, logger usage, and consistent JSON responses
import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from "../Prisma";
import logger from "../logger";
import nodemailer from 'nodemailer';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const registerSchema = z.object({
  name: z.string().nonempty('Name is required'),
  email: z.string().nonempty('Email is required').email('Invalid email format'),
  password: z.string().nonempty('Password is required'),
});


export const registerUser = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn('Invalid registration data');
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: parsed.error.flatten().fieldErrors
    });
  }

  const { name, email, password } = parsed.data;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      logger.info(`User already exists: ${email}`);
      return res.status(409).json({ success: false, message: 'User already exists', data: null });
    }

    const hashedPassword = await bcrypt.hash(password, 11);

    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '1d' });
    await prisma.user.update({ where: { id: newUser.id }, data: { authtoken: token } });

    logger.info(`User registered: ${email}`);
    return res.status(200).json({ success: true, message: 'User registered successfully', data: { token } });

  } catch (e: any) {
    logger.error(`Registration failed for ${email}: ${e.message}`);
    return res.status(500).json({ success: false, message: 'Registration failed', data: { error: e.message } });
  }
};

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  password: z.string({ message: 'Password is required' })
});

export const loginUser = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn('Invalid login data');
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: parsed.error.flatten().fieldErrors
    });
  }

  const { email, password } = parsed.data;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.password) {
      logger.warn(`Login failed: User not found for email: ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials', data: null });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Login failed: Incorrect password for ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials', data: null });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
    await prisma.user.update({ where: { id: user.id }, data: { authtoken: token } });

    logger.info(`User logged in: ${email}`);
    return res.status(200).json({ success: true, message: 'Login successful', data: { token } });
  } catch (e: any) {
    logger.error(`Login failed for ${email}: ${e.message}`);
    return res.status(500).json({ success: false, message: 'Login failed', data: { error: e.message } });
  }
};

export const verifytoken = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    logger.warn('Token is missing');
    return res.status(401).json({ success: false, message: "Token is missing", data: null });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    logger.info('Token verified');
    return res.json({ success: true, message: 'Token verified', data: { user: decoded } });
  } catch (error) {
    logger.warn('Invalid token provided');
    return res.status(403).json({ success: false, message: "Invalid token", data: null });
  }
};

const emailSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' })
});

export const forgotPassword = async (req: Request, res: Response) => {
  const parsed = emailSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn('Invalid forgot password request');
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: parsed.error.flatten().fieldErrors
    });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    logger.info(`Forgot password attempted for non-existing email: ${email}`);
    return res.status(404).json({ success: false, message: 'User not found', data: null });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 2 * 60 * 1000);

  await prisma.user.update({ where: { id: user.id }, data: { otp, otpExpiry } });
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  await transporter.sendMail({
    to: email,
    subject: 'MerzaCars Password Reset OTP',
    html: `<p>Your OTP is: <b>${otp}</b> (valid for 2 minutes)</p>`
  });

  logger.info(`OTP sent to ${email}`);
  return res.json({ success: true, message: 'OTP sent to email', data: {token} });
};

const otpValidationSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  otp: z.string({ message: 'OTP is required' })
});

export const validateOtp = async (req: Request, res: Response) => {
  const parsed = otpValidationSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn('Invalid OTP validation data');
    return res.status(400).json({ success: false, message: "Validation failed", data: parsed.error.flatten().fieldErrors });
  }

  const { email, otp } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    logger.info(`OTP validation failed: User not found: ${email}`);
    return res.status(404).json({ success: false, message: "User not found", data: null });
  }

  if (!user.otp || user.otp !== otp) {
    logger.warn(`Invalid OTP attempt for ${email}`);
    return res.status(400).json({ success: false, message: "Invalid OTP", data: null });
  }

  if (new Date() > new Date(user.otpExpiry!)) {
    logger.warn(`OTP expired for ${email}`);
    return res.status(400).json({ success: false, message: "OTP has expired", data: null });
  }

  const resettoken = jwt.sign({ id: user.id, purpose: 'reset' }, JWT_SECRET, { expiresIn: '5m' });
  await prisma.user.update({ where: { email }, data: { resetToken: resettoken, resetTokenExpiry: new Date(Date.now() + 5 * 60 * 1000) } });

  logger.info(`OTP validated, token issued for ${email}`);
  return res.status(200).json({ success: true, message: "OTP verified", data: { resettoken } });
};

const resetPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  newPassword: z.string().min(6, { message: 'Password must be at least 6 characters' })
});

export const resetPassword = async (req: Request, res: Response) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn('Invalid reset password data');
    return res.status(400).json({ success: false, message: "Validation failed", data: parsed.error.flatten().fieldErrors });
  }

  const { email, newPassword } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    logger.info(`Reset password failed: User not found: ${email}`);
    return res.status(404).json({ success: false, message: "User not found", data: null });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { email }, data: { password: hashedPassword, otp: null, otpExpiry: null } });

  logger.info(`Password reset successfully for ${email}`);
  return res.status(200).json({ success: true, message: "Password updated successfully", data: null });
};
