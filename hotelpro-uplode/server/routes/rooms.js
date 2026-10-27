const express = require('express');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// GET /api/rooms  - all rooms (public)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await Room.find().sort({ roomNumber: 1 }));
  })
);

// GET /api/rooms/available?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&guests=2
router.get(
  '/available',
  asyncHandler(async (req, res) => {
    const { checkIn, checkOut, guests } = req.query;
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (isNaN(inDate) || isNaN(outDate) || outDate <= inDate) {
      return res.status(400).json({ message: 'Please provide a valid check-in and check-out date' });
    }
    // Rooms that overlap with an active booking in the requested window
    const clashing = await Booking.find({
      status: { $in: ['confirmed', 'checked-in'] },
      checkIn: { $lt: outDate },
      checkOut: { $gt: inDate },
    }).distinct('room');

    const filter = { status: 'available', _id: { $nin: clashing } };
    if (guests) filter.capacity = { $gte: Number(guests) };
    res.json(await Room.find(filter).sort({ price: 1 }));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  })
);

// Admin only: create / update / delete
router.post(
  '/',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    if (await Room.findOne({ roomNumber: req.body.roomNumber })) {
      return res.status(400).json({ message: 'Room number already exists' });
    }
    res.status(201).json(await Room.create(req.body));
  })
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  })
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const active = await Booking.exists({
      room: req.params.id,
      status: { $in: ['confirmed', 'checked-in'] },
    });
    if (active) return res.status(400).json({ message: 'Room has active bookings and cannot be deleted' });
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room deleted' });
  })
);

module.exports = router;
