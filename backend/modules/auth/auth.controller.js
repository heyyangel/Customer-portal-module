import User from '../../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ user: name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.user,
        email: user.email,
        role: user.role,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User is not registered. Please create an account.' });
    }

    // Support both legacy bcrypt hashes and new plaintext passwords
    const isMatch = (user.password === password) || (await bcrypt.compare(password, user.password).catch(() => false));
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.user || user.email,
        email: user.email,
        role: user.role,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Self-service profile update. A user may change their own display name, photo
// and notification preferences — but not their email, company, role or category
// (those remain admin-controlled via user management).
export const updateMe = async (req, res, next) => {
  try {
    const { user: name, avatar, preferences } = req.body;
    const updates = {};
    if (name !== undefined) updates.user = name;
    if (avatar !== undefined) updates.avatar = avatar;
    if (preferences && typeof preferences === 'object') {
      if ('emailNotifications' in preferences) updates['preferences.emailNotifications'] = !!preferences.emailNotifications;
      if ('pushNotifications' in preferences) updates['preferences.pushNotifications'] = !!preferences.pushNotifications;
    }

    const updated = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Change own password. Verifies the current password (supporting both legacy
// bcrypt hashes and the plaintext scheme used elsewhere), then stores the new one.
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }
    if (String(newPassword).length < 5) {
      return res.status(400).json({ success: false, message: 'New password must be at least 5 characters.' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = (user.password === currentPassword) || (await bcrypt.compare(currentPassword, user.password).catch(() => false));
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    // Stored plaintext to remain consistent with the current auth scheme.
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
};



