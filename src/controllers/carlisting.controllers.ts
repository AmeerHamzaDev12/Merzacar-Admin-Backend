import e, { Request, Response } from 'express';
import prisma from '../Prisma';
import path from 'path';
import fs from 'fs-extra';
import logger from '../logger';
import { z } from 'zod';
import { uploadToCloudinary } from '../utils/cloudinary';
import { v2 as cloudinary } from 'cloudinary';



export const getAllCars = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const [cars, total] = await Promise.all([
      prisma.carListing.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc', 
        },
        include: {
        galleryImages: true,
        attachments: true,
        features: true,
        safetyFeatures: true
      }
      }),
      prisma.carListing.count()
    ]);

    const totalPages = Math.ceil(total / limit);
       logger.info('All cars fetched');

    return res.status(200).json({
      success: true,
      data: cars,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      }
    });
  } catch (error) {
     logger.error(`Error fetching cars: ${e}`);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getcar = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const specificcar = await prisma.carListing.findUnique({
      where: { id },
      include: {
        galleryImages: true,
        attachments: true,
        features: true,
        safetyFeatures: true
      }
    });

    if (!specificcar) {
      logger.warn(`Car not found: ${id}`);
      return res.status(404).json({ success: false, message: 'Car not found', data: null });
    }

    res.status(200).json({ success: true, message: 'Car fetched successfully', data: specificcar });
  } catch (e: any) {
    logger.error(`Error fetching car: ${e.message}`);
    res.status(500).json({ success: false, message: 'Error Occurred! Failed to fetch car', data: { error: e.message } });
  }
};

export const carSchema = z.object({
  title: z.string().nonempty("Title is required"),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().int().optional(),
  condition: z.enum(["NEW", "USED"]),
  type: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be non-negative").optional(),
  color: z.string().optional(),
  mileage: z.coerce.number().optional(),
  transmission: z.string().optional(),
  fuelType: z.string().optional(),
  videoLink: z.string().optional(),
  driveType: z.string().optional(),
  engineSize: z.coerce.number().optional(),
  cylinders: z.coerce.number().int().optional(),
  doors: z.coerce.number().int().optional(),
  vin: z.string().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  safetyFeatures: z.array(z.string()).optional()
});

const removeEmpty = (obj: Record<string, any>) => {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([_, v]) => v !== undefined && v !== null && v !== ''
    )
  );
};

export const createCar = async (req: Request, res: Response) => {
  try {
    const parsed = carSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn('Create car failed - validation error');
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: parsed.error.flatten().fieldErrors
      });
    }

    const {
      title,
      condition,
      features = [],
      safetyFeatures = [],
      ...rest
    } = parsed.data;

    const optionalData = removeEmpty(rest);
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const imageFiles = files?.galleryImages || [];
    const attachmentFiles = files?.attachments || [];

// Upload images to Cloudinary
const uploadedImages = await Promise.all(
  imageFiles.map(async (file) => {
    const uploadResult = await uploadToCloudinary(file.path, 'car-images');
    return { url: uploadResult.secure_url };  // <-- only url string here
  })
);

// Upload attachments to Cloudinary
const uploadedAttachments = await Promise.all(
  attachmentFiles.map(async (file) => {
    const uploadResult = await uploadToCloudinary(file.path, 'car-attachments');
    return {
      fileUrl: uploadResult.secure_url, // <-- only url string here
      originalName: file.originalname
    };
  })
);

    const newCar = await prisma.carListing.create({
      data: {
        title,
        condition,
        ...optionalData,
        galleryImages: {
          create: uploadedImages
        },
        attachments: {
          create: uploadedAttachments
        },
        features: {
          create: features.map((name) => ({ name }))
        },
        safetyFeatures: {
          create: safetyFeatures.map((name) => ({ name }))
        }
      },
      include: {
        galleryImages: true,
        attachments: true,
        features: true,
        safetyFeatures: true
      }
    });

    logger.info('Car created successfully');
    return res.status(201).json({
      success: true,
      message: 'Car created successfully',
      data: newCar
    });
  } catch (e: any) {
    logger.error(`Error creating car: ${e.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to create car',
      data: { error: e.message }
    });
  }
};


export const updateCar = async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate input
  const parsed = carSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn('Update car failed - validation error');
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: parsed.error.flatten().fieldErrors
    });
  }

  const {
    title, make, model, year, condition, type, price,
    color, mileage, transmission, fuelType, videoLink,
    features = [], safetyFeatures = []
  } = parsed.data;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const imageFiles = files?.galleryImages || [];
  const attachmentFiles = files?.attachments || [];

  try {
    // Fetch existing car with images and attachments (to get publicIds)
    const existingCar = await prisma.carListing.findUnique({
      where: { id },
      include: {
        galleryImages: true,
        attachments: true,
      }
    });
    if (!existingCar) {
      logger.warn(`Car not found: ${id}`);
      return res.status(404).json({ success: false, message: 'Car not found', data: null });
    }

    // Delete old images from Cloudinary
    await Promise.all(
      existingCar.galleryImages.map(img => {
        if (img.publicId) {
          return cloudinary.uploader.destroy(img.publicId).catch(() => {});
        }
        return Promise.resolve();
      })
    );

    // Delete old attachments from Cloudinary
    await Promise.all(
      existingCar.attachments.map(att => {
        if (att.publicId) {
          return cloudinary.uploader.destroy(att.publicId).catch(() => {});
        }
        return Promise.resolve();
      })
    );

    // Delete old DB records related to images, attachments, features, safetyFeatures
    await prisma.galleryImage.deleteMany({ where: { carListingId: id } });
    await prisma.carAttachment.deleteMany({ where: { carListingId: id } });
    await prisma.carFeature.deleteMany({ where: { carListingId: id } });
    await prisma.carSafetyFeature.deleteMany({ where: { carListingId: id } });

    // Upload new images to Cloudinary
    const uploadedImages = await Promise.all(
      imageFiles.map(async (file) => {
        const uploadResult = await uploadToCloudinary(file.path, 'car-images');
        return {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id
        };
      })
    );

    // Upload new attachments to Cloudinary
    const uploadedAttachments = await Promise.all(
      attachmentFiles.map(async (file) => {
        const uploadResult = await uploadToCloudinary(file.path, 'car-attachments');
        return {
          fileUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          originalName: file.originalname
        };
      })
    );

    // Update car record with new data
    const updatedCar = await prisma.carListing.update({
      where: { id },
      data: {
        title, make, model, year, condition, type, price,
        color, mileage, transmission, fuelType, videoLink,

        galleryImages: {
          create: uploadedImages
        },

        attachments: {
          create: uploadedAttachments
        },

        features: {
          create: features.map(name => ({ name }))
        },

        safetyFeatures: {
          create: safetyFeatures.map(name => ({ name }))
        }
      },
      include: {
        galleryImages: true,
        attachments: true,
        features: true,
        safetyFeatures: true
      }
    });

    logger.info(`Car updated: ${id}`);

    return res.status(200).json({
      success: true,
      message: 'Car updated successfully',
      data: updatedCar
    });
  } catch (e: any) {
    logger.error(`Error updating car: ${e.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to update car',
      data: { error: e.message }
    });
  }
};


export const deleteCar = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existing = await prisma.carListing.findUnique({
      where: { id },
      include: {
        galleryImages: true,
        attachments: true
      }
    });

    if (!existing) {
      logger.warn(`Car not found for deletion: ${id}`);
      return res.status(404).json({ success: false, message: 'Car not found' });
    }

    existing.galleryImages.forEach(img => {
      fs.removeSync(path.join('public', img.url));
    });

    existing.attachments.forEach(att => {
      fs.removeSync(path.join('public', att.fileUrl));
    });

    await prisma.carListing.delete({ where: { id } });

    logger.info(`Car deleted: ${id}`);
    return res.status(200).json({ success: true, message: 'Car deleted successfully' });
  } catch (e: any) {
    logger.error(`Error deleting car: ${e.message}`);
    return res.status(500).json({ success: false, message: 'Failed to delete car', data: { error: e.message } });
  }
};
