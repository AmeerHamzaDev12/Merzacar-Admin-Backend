import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';

const getUploadFolder = (fieldname: string) => {
  switch (fieldname) {
    case 'profileImage':
      return path.join(__dirname, '../../uploads');
    case 'galleryImages':
      return path.join(__dirname, '../../uploads/car-images');
    case 'attachments':
      return path.join(__dirname, '../../uploads/car-attachments');
    default:
      return path.join(__dirname, '../../uploads'); 
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = getUploadFolder(file.fieldname);
    fs.ensureDirSync(folder);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export default upload;
