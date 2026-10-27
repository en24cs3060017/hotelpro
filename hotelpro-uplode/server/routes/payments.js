const express = require('express');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(protect);

// POST /api/payments  { bookingId, method }
// NOTE: payment gateway is simulated for this project (no real money moves).
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { bookingId, method } = req.body;
    if (!['card', 'upi', 'cash'].includes(method)) {
      return res.status(400).json({ message: 'Choose a valid payment method' });
    }
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only pay for your own bookings' });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Cancelled bookings cannot be paid' });
    }
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'This booking is already paid' });
    }

    const payment = await Payment.create({
      booking: booking._id,
      user: req.user._id,
      amount: booking.totalAmount,
      method,
      transactionId: 'TXN' + Date.now() + Math.floor(Math.random() * 1000),
    });
    booking.paymentStatus = 'paid';
    await booking.save();
    res.status(201).json(payment);
  })
);

// GET /api/payments  (admin) - all payments
router.get(
  '/',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    res.json(await Payment.find().populate('user', 'name email').sort({ createdAt: -1 }));
  })
);

module.exports = router;
