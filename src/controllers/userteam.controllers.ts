// NOTE: This is the improved user team controller with Zod validation and consistent logger and response usage
import { Request, Response } from 'express';
import prisma from '../Prisma';
import path from 'path';
import fs from 'fs-extra';
import logger from '../logger';
import { z } from 'zod';

const teamMemberSchema = z.object({
  name: z.string().nonempty('Name is required'),
  role: z.string().nonempty('Role is required'),
  email: z.string().nonempty('Email is required').email('Invalid email format'),
  phone: z.string().nonempty('Phone number is required'),
});

const isDev = process.env.NODE_ENV === 'development';

export const getAllTeamMembers = async (_req: Request, res: Response) => {
  try {
    const members = await prisma.userTeam.findMany();
    logger.info('Team members fetched successfully');
    res.status(200).json({ success: true, message: 'Team members fetched', data: members });
  } catch (e: any) {
    logger.error(`Error fetching team members: ${e.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members',
      ...(isDev && { data: { error: e.message } }),
    });
  }
};

export const getTeamMemberById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ success: false, message: 'Team member ID is required', data: null });

  try {
    const member = await prisma.userTeam.findUnique({ where: { id } });
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found', data: null });

    res.status(200).json({ success: true, message: 'Team member fetched', data: member });
  } catch (e: any) {
    logger.error(`Error fetching team member: ${e.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch member',
      ...(isDev && { data: { error: e.message } }),
    });
  }
};

export const createTeamMember = async (req: Request, res: Response) => {
  const parsed = teamMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn('Create team member failed - validation error');
    const errorData = parsed.error.flatten();
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: {
        fieldErrors: errorData.fieldErrors,
        formErrors: errorData.formErrors,
      },
    });
  }

  const { name, role, email, phone } = parsed.data;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const member = await prisma.userTeam.create({ data: { name, role, email, phone, imageUrl } });
    logger.info(`Team member created: ${email}`);
    res.status(201).json({ success: true, message: 'Team member created', data: member });
  } catch (e: any) {
    logger.error(`Error creating team member: ${e.message}`);
    if (e.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create team member',
      ...(isDev && { data: { error: e.message } }),
    });
  }
};

export const updateTeamMember = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ success: false, message: 'Team member ID is required', data: null });

  const parsed = teamMemberSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    logger.warn('Update team member failed - validation error');
    const errorData = parsed.error.flatten();
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: {
        fieldErrors: errorData.fieldErrors,
        formErrors: errorData.formErrors,
      },
    });
  }

  const { name, role, email, phone } = parsed.data;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  try {
    const existing = await prisma.userTeam.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Team member not found', data: null });

    if (existing.imageUrl && imageUrl) {
      const oldPath = path.join(__dirname, '../../', existing.imageUrl);
      if (fs.existsSync(oldPath)) {
        await fs.remove(oldPath);
      }
    }

    const updated = await prisma.userTeam.update({
      where: { id },
      data: { name, role, email, phone, ...(imageUrl && { imageUrl }) },
    });

    logger.info(`Team member updated: ${id}`);
    res.status(200).json({ success: true, message: 'Team member updated', data: updated });
  } catch (e: any) {
    logger.error(`Error updating team member: ${e.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to update team member',
      ...(isDev && { data: { error: e.message } }),
    });
  }
};

export const deleteTeamMember = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ success: false, message: 'Team member ID is required', data: null });

  try {
    const existing = await prisma.userTeam.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Team member not found', data: null });

    if (existing.imageUrl) {
      const imagePath = path.join(__dirname, '../../', existing.imageUrl);
      if (fs.existsSync(imagePath)) {
        await fs.remove(imagePath);
      }
    }

    await prisma.userTeam.delete({ where: { id } });
    logger.info(`Team member deleted: ${id}`);
    res.status(200).json({ success: true, message: 'Team member deleted', data: null });
  } catch (e: any) {
    logger.error(`Error deleting team member: ${e.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to delete team member',
      ...(isDev && { data: { error: e.message } }),
    });
  }
};
