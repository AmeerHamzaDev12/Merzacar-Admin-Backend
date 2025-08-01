import express from "express";
import{
    getAllCars,
    getcar,
    createCar,
    updateCar,
    deleteCar
} from '../controllers/carlisting.controllers';
import upload from "../utils/multer";

const router = express.Router();
router.get('/', getAllCars);
router.get('/:id', getcar);
router.post('/', upload.fields([
    { name: 'galleryImages', maxCount: 50 },
    { name: 'attachments', maxCount: 50 }
  ]), createCar);

router.put('/:id', upload.fields([
    {name: 'galleryImages', maxCount:50},
    {name: 'attachments', maxCount:50}
]), updateCar);

router.delete('/:id', deleteCar);

export default router;