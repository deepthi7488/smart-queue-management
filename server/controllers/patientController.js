const Token = require('../models/Token');
const User = require('../models/User');

// @desc    Get all patients with token history, filtering & search (Admin)
// @route   GET /api/patients
// @access  Private/Admin
exports.getAllPatients = async (req, res) => {
  try {
    const { search, tokenType, status } = req.query;

    const query = {};

    if (tokenType) {
      query.tokenType = tokenType;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: 'i' } },
        { patientPhone: { $regex: search, $options: 'i' } },
        { tokenNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const tokens = await Token.find(query)
      .populate('doctorId', 'name specialization roomNumber')
      .populate('patientId', 'email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tokens.length,
      data: tokens,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch patients list',
    });
  }
};
