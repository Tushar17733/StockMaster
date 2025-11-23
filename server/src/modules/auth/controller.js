// src/modules/auth/controller.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, PasswordResetToken } from '../../models/index.js';
import { config } from '../../config/index.js';

export const authController = {
  async signup(req, res, next) {
    try {
      const { name, email, phone, password, role = 'WAREHOUSE_STAFF' } = req.body;

      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user with error handling
      let user;
      try {
        user = await User.create({
          name,
          email: email.toLowerCase().trim(),
          phone: phone?.trim(),
          passwordHash,
          role
        });
        
        console.log('✅ User created successfully:', {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        });
      } catch (dbError) {
        console.error('❌ Database error creating user:', dbError);
        
        // Handle duplicate key error
        if (dbError.code === 11000) {
          return res.status(409).json({
            success: false,
            message: 'User already exists with this email'
          });
        }
        
        // Handle validation errors
        if (dbError.name === 'ValidationError') {
          const errors = Object.values(dbError.errors).map(err => err.message).join(', ');
          return res.status(400).json({
            success: false,
            message: `Validation error: ${errors}`
          });
        }
        
        throw dbError;
      }

      // Return user data without password
      const userResponse = {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt
      };

      // Generate JWT token
      const token = jwt.sign(
        { id: userResponse.id.toString(), email: userResponse.email, role: userResponse.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error) {
      console.error('❌ Signup error:', error);
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() })
        .populate('defaultWarehouseId', 'id name code');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user._id.toString(), 
          email: user.email, 
          role: user.role 
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Return user data (without password)
      const userResponse = {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        defaultWarehouse: user.defaultWarehouseId ? {
          id: user.defaultWarehouseId._id,
          name: user.defaultWarehouseId.name,
          code: user.defaultWarehouseId.code
        } : null
      };

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async requestOtp(req, res, next) {
    try {
      const { email } = req.body;

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });

      // For security, don't reveal if user exists or not
      if (!user) {
        return res.json({
          success: true,
          message: 'If user exists, OTP has been generated.'
        });
      }

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Set expiry (10 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + config.otp.expiryMinutes);

      // Store OTP in database
      await PasswordResetToken.create({
        userId: user._id,
        otpCode,
        expiresAt
      });

      // In production, you would send this via email
      // For development, we'll log it
      console.log(`OTP for ${email}: ${otpCode}`);

      res.json({
        success: true,
        message: 'If user exists, OTP has been generated.'
      });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { email, otp_code, new_password } = req.body;

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Invalid OTP or user not found'
        });
      }

      // Find valid OTP token
      const otpToken = await PasswordResetToken.findOne({
        userId: user._id,
        otpCode: otp_code,
        used: false,
        expiresAt: { $gt: new Date() }
      });

      if (!otpToken) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(new_password, 12);

      // Update user password and mark OTP as used in a session/transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        await User.updateOne(
          { _id: user._id },
          { $set: { passwordHash } },
          { session }
        );

        await PasswordResetToken.updateOne(
          { _id: otpToken._id },
          { $set: { used: true } },
          { session }
        );

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async getMe(req, res, next) {
    try {
      const user = await User.findById(req.user.id)
        .populate('defaultWarehouseId', 'id name code')
        .select('-passwordHash');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userResponse = {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        defaultWarehouse: user.defaultWarehouseId ? {
          id: user.defaultWarehouseId._id,
          name: user.defaultWarehouseId.name,
          code: user.defaultWarehouseId.code
        } : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      res.json({
        success: true,
        data: { user: userResponse }
      });
    } catch (error) {
      next(error);
    }
  }
};