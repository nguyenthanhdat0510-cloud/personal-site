require('dotenv').config();
const mongoose = require('mongoose');
const Profile = require('./models/Profile');

const seedData = {
  slug: 'main',
  name: 'Nguyễn Thành Đạt',
  title: 'Sinh viên Vi điện tử / Điện tử Nhúng - HUST',
  bio: 'Sinh viên Đại học Bách Khoa Hà Nội (HUST), theo học Vi điện tử - Công nghệ Nano và Hệ thống nhúng. Quan tâm đến IoT, cảm biến khí, và các dự án nhúng dựa trên ESP32.',
  avatarUrl: '',
  phone: 'ĐIỀN SỐ ĐIỆN THOẠI CỦA BẠN',
  email: '',
  socials: {
    facebook: 'https://facebook.com/ĐIỀN-USERNAME-CỦA-BẠN',
    tiktok: 'https://tiktok.com/@ĐIỀN-USERNAME-CỦA-BẠN',
    instagram: 'https://instagram.com/ĐIỀN-USERNAME-CỦA-BẠN'
  },
  schedule: [
    { day: 'Thứ 2', start: '07:00', end: '09:30', subject: 'Hệ thống nhúng (MS3220)', room: 'D3-401' },
    { day: 'Thứ 3', start: '13:00', end: '15:30', subject: 'Kinh tế Chính trị Mác-Lênin', room: 'D5-201' },
    { day: 'Thứ 5', start: '07:00', end: '09:30', subject: 'Hệ thống nhúng - Thực hành (MS3221)', room: 'Lab D3-B2' }
  ]
};

async function seed() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Thiếu MONGODB_URI trong file .env');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    await Profile.findOneAndUpdate({ slug: 'main' }, seedData, { upsert: true, new: true });
    console.log('Seed dữ liệu thành công! Nhớ vào /admin.html để sửa lại số điện thoại và link mạng xã hội thật.');
  } catch (err) {
    console.error('Seed thất bại:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
