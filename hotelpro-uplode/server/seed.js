// Run once:  npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Room = require('./models/Room');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany({}), Room.deleteMany({})]);

  await User.create([
    { name: 'Admin', email: 'admin@hotelpro.com', password: 'Admin@123', role: 'admin' },
    { name: 'Front Desk', email: 'staff@hotelpro.com', password: 'Staff@123', role: 'staff' },
    { name: 'Demo Guest', email: 'guest@hotelpro.com', password: 'Guest@123', role: 'guest' },
  ]);

  await Room.create([
    { roomNumber: '101', type: 'Single', price: 1800, capacity: 1, amenities: ['WiFi', 'AC', 'TV'], description: 'Compact room for solo travellers.' },
    { roomNumber: '102', type: 'Single', price: 1900, capacity: 1, amenities: ['WiFi', 'AC', 'Work desk'], description: 'Quiet single room with a work desk.' },
    { roomNumber: '201', type: 'Double', price: 2800, capacity: 2, amenities: ['WiFi', 'AC', 'TV', 'Breakfast'], description: 'Queen bed with breakfast included.' },
    { roomNumber: '202', type: 'Double', price: 3000, capacity: 3, amenities: ['WiFi', 'AC', 'TV', 'Balcony'], description: 'Spacious double with a balcony.' },
    { roomNumber: '301', type: 'Deluxe', price: 4500, capacity: 3, amenities: ['WiFi', 'AC', 'Mini bar', 'Bathtub'], description: 'Deluxe room with city view.' },
    { roomNumber: '401', type: 'Suite', price: 7500, capacity: 4, amenities: ['WiFi', 'AC', 'Lounge', 'Mini bar', 'Breakfast'], description: 'Two-room suite with a private lounge.' },
  ]);

  console.log('Seed done. Logins: admin@hotelpro.com / Admin@123, staff@hotelpro.com / Staff@123, guest@hotelpro.com / Guest@123');
  process.exit(0);
})();
