const express = require('express');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(protect);

const DAY = 24 * 60 * 60 * 1000;

// POST /api/bookings  - create a booking (checks availability)
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { roomId, checkIn, checkOut, guests } = req.body;
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);

    if (!roomId || isNaN(inDate) || isNaN(outDate)) {
      return res.status(400).json({ message: 'Room, check-in and check-out are required' });
    }
    if (outDate <= inDate) {
      return res.status(400).json({ message: 'Check-out must be after check-in' });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (inDate < new Date(today.getTime() - DAY)) {
      return res.status(400).json({ message: 'Check-in date cannot be in the past' });
    }

    const room = await Room.findById(roomId);
    if (!room || room.status !== 'available') {
      return res.status(400).json({ message: 'This room is not available for booking' });
    }
    const guestCount = Number(guests) || 1;
    if (guestCount > room.capacity) {
      return res.status(400).json({ message: `This room fits at most ${room.capacity} guests` });
    }

    const clash = await Booking.exists({
      room: room._id,
      status: { $in: ['confirmed', 'checked-in'] },
      checkIn: { $lt: outDate },
      checkOut: { $gt: inDate },
    });
    if (clash) {
      return res.status(409).json({ message: 'Room is already booked for these dates' });
    }

    const nights = Math.ceil((outDate - inDate) / DAY);
    const booking = await Booking.create({
      user: req.user._id,
      room: room._id,
      checkIn: inDate,
      checkOut: outDate,
      guests: guestCount,
      nights,
      totalAmount: nights * room.price,
    });
    res.status(201).json(await booking.populate('room'));
  })
);

// GET /api/bookings/my  - bookings of logged-in user
router.get(
  '/my',
  asyncHandler(async (req, res) => {
    res.json(await Booking.find({ user: req.user._id }).populate('room').sort({ createdAt: -1 }));
  })
);

// GET /api/bookings  - all bookings (staff/admin)
router.get(
  '/',
  authorize('staff', 'admin'),
  asyncHandler(async (req, res) => {
    res.json(
      await Booking.find().populate('room').populate('user', 'name email phone').sort({ createdAt: -1 })
    );
  })
);

// PUT /api/bookings/:id/cancel  - owner or staff/admin
router.put(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    const isOwner = booking.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role === 'guest') {
      return res.status(403).json({ message: 'You can only cancel your own bookings' });
    }
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: `A ${booking.status} booking cannot be cancelled` });
    }
    booking.status = 'cancelled';
    await booking.save();
    res.json(booking);
  })
);

// PUT /api/bookings/:id/checkin  (staff/admin)
router.put(
  '/:id/checkin',
  authorize('staff', 'admin'),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Only confirmed bookings can be checked in' });
    }
    booking.status = 'checked-in';
    await booking.save();
    res.json(booking);
  })
);

// PUT /api/bookings/:id/checkout  (staff/admin)
router.put(
  '/:id/checkout',
  authorize('staff', 'admin'),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'checked-in') {
      return res.status(400).json({ message: 'Only checked-in bookings can be checked out' });
    }
    booking.status = 'checked-out';
    await booking.save();
    res.json(booking);
  })
);

module.exports = router;
