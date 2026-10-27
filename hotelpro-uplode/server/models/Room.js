const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true, trim: true },
    type: { type: String, enum: ['Single', 'Double', 'Deluxe', 'Suite'], required: true },
    price: { type: Number, required: true, min: 0 }, // per night
    capacity: { type: Number, required: true, min: 1 },
    amenities: [String],
    description: String,
    status: { type: String, enum: ['available', 'maintenance'], default: 'available' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
