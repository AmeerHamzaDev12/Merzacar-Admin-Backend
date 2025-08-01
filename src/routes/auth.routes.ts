import express from 'express';
import { loginUser, registerUser,forgotPassword,resetPassword,validateOtp,verifytoken } from '../controllers/auth.controllers';
import { authenticateToken } from '../middleware/auth.middleware';

const authrouter = express.Router();

authrouter.post('/auth/register', registerUser);
authrouter.post('/auth/login', loginUser);
authrouter.post('/auth/verifytoken',verifytoken);
authrouter.post('/auth/forgotpassword',forgotPassword);
authrouter.post('/auth/validOTP',validateOtp);
authrouter.post('/auth/resetpassword',authenticateToken('reset'), resetPassword);

export default authrouter;