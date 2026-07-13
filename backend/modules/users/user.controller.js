import User from '../../models/User.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// Admin creates a customer, choosing its category (MSIL / Non-MSIL).
export const createUser = async (req, res, next) => {
  try {
    const { email, password, user, company, role, customerCategory, status, brandAccess } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
    }

    const newUser = await User.create({
      email,
      password,
      user: user || null,
      company: company || null,
      role: role === 'Admin' ? 'Admin' : 'Customer',
      customerCategory: customerCategory === 'MSIL' ? 'MSIL' : 'Non-MSIL',
      status: status || 'Active',
      ...(brandAccess ? { brandAccess } : {}),
    });

    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    next(error);
  }
};

// Admin updates a user, including changing the customer category at any time.
export const updateUser = async (req, res, next) => {
  try {
    const allowed = ['user', 'company', 'email', 'role', 'customerCategory', 'status', 'brandAccess', 'showMsilCode'];
    const updates = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    if (updates.customerCategory && !['MSIL', 'Non-MSIL'].includes(updates.customerCategory)) {
      return res.status(400).json({ success: false, message: 'Invalid customer category. Use "MSIL" or "Non-MSIL".' });
    }

    // If email is being changed, ensure it is not taken by another user.
    if (updates.email) {
      updates.email = updates.email.toLowerCase();
      const clash = await User.findOne({ email: updates.email, _id: { $ne: req.params.id } });
      if (clash) {
        return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// Admin resets another user's password. No current-password check — this is an
// administrative override, gated by the manage_users permission on the route.
// Stored plaintext to remain consistent with the current auth scheme.
export const resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 5) {
      return res.status(400).json({ success: false, message: 'New password must be at least 5 characters.' });
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: `Password reset for ${user.email}.` });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
