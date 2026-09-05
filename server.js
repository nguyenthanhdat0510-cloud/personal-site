require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiRoutes);

// Health check - hữu ích khi deploy lên Render/VPS
app.get('/health', (req, res) => res.json({ status: 'ok' }));

async function start() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Thiếu MONGODB_URI trong file .env. Xem .env.example để biết cách cấu hình.');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Đã kết nối MongoDB thành công');

    app.listen(PORT, () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Không thể khởi động server:', err.message);
    process.exit(1);
  }
}

start();
