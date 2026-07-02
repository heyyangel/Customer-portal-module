import Role from '../../models/Role.js';

export const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find();
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

export const updateRolePermissions = async (req, res, next) => {
  try {
    const { permissions } = req.body;
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { permissions },
      { new: true, runValidators: true }
    );

    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    
    res.status(200).json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};
