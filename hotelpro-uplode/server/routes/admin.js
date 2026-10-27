const express = require('express');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(protect, authorize('staff', 'admin'));

// GET /api/admin/stats
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const [totalRooms, occupiedRooms, totalBookings, upcoming, totalGuests, revenueAgg] =
      await Promise.all([
        Room.countDocuments(),
        Booking.countDocuments({ status: 'checked-in' }),
        Booking.countDocuments(),
        Booking.countDocuments({ status: 'confirmed' }),
        User.countDocuments({ role: 'guest' }),
        Payment.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      ]);
    res.json({
      totalRooms,
      occupiedRooms,
      occupancyRate: totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      totalBookings,
      upcomingBookings: upcoming,
      totalGuests,
      revenue: revenueAgg[0] ? revenueAgg[0].total : 0,
    });
  })
);

module.exports = router;
