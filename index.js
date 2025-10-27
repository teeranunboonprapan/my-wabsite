const express = require('express');
const path = require('path');
const mongoose = require('mongoose'); // <-- 1. เรียกใช้ mongoose
const Booking = require('./models/Booking'); // Import the Booking model
const app = express();
const PORT = process.env.PORT || 5000;

// --- 2. ใส่ "กุญแจ" MongoDB Atlas ของคุณที่นี่ ---
// ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓
const MONGO_URI = "mongodb+srv://teeranun223:K0952230490@cluster2.1pv0lvi.mongodb.net/?appName=Cluster2";
// ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑

// --- 3. คำสั่งเชื่อมต่อฐานข้อมูล ---
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("เชื่อมต่อ MongoDB สำเร็จ!");

    // Function to delete past bookings
    const deletePastBookings = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to the beginning of today to avoid timezone issues

        const result = await Booking.deleteMany({ date: { $lt: today } });
        if (result.deletedCount > 0) {
          console.log(`ลบข้อมูลการจองที่หมดอายุแล้วจำนวน: ${result.deletedCount} รายการ`);
        } else {
          console.log('ไม่พบข้อมูลการจองที่หมดอายุ');
        }
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบข้อมูลการจองที่หมดอายุ:', error);
      }
    };

    // Run the function once on startup
    deletePastBookings();

    // Schedule the function to run every 24 hours
    setInterval(deletePastBookings, 24 * 60 * 60 * 1000);
  })
  .catch((err) => console.error("เกิดข้อผิดพลาดในการเชื่อมต่อ:", err));


// --- Middleware ---
app.use(express.json()); // Middleware สำหรับ parse JSON

// --- Serve Static Files ---
// ให้ Express เสิร์ฟไฟล์จากโฟลเดอร์ปัจจุบัน (เช่น index.html, app.js)
app.use(express.static(__dirname));

// --- API Routes ---
const bookingRoutes = require('./routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- สั่งให้เซิร์ฟเวอร์เริ่มทำงาน ---
app.listen(PORT, () => {
  console.log(`เซิร์ฟเวอร์กำลังทำงานที่ http://localhost:${PORT}`);
});
