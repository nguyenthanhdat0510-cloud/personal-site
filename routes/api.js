const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');

// Middleware kiểm tra token admin (đọc từ header "x-admin-token")
function requireAdmin(req, res, next) {
  const token = req.header('x-admin-token');
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Sai hoặc thiếu admin token' });
  }
  next();
}

// GET /api/profile - lấy thông tin công khai
router.get('/profile', async (req, res) => {
  try {
    const profile = await Profile.findOne({ slug: 'main' }).lean();
    if (!profile) {
      return res.status(404).json({ error: 'Chưa có dữ liệu profile, hãy chạy "npm run seed" trước' });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server', detail: err.message });
  }
});

// PUT /api/profile - cập nhật toàn bộ hoặc một phần thông tin (cần admin token)
router.put('/profile', requireAdmin, async (req, res) => {
  try {
    const updates = req.body;
    const profile = await Profile.findOneAndUpdate(
      { slug: 'main' },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(profile);
  } catch (err) {
    res.status(400).json({ error: 'Cập nhật thất bại', detail: err.message });
  }
});

// POST /api/profile/schedule - thêm 1 buổi học mới (cần admin token)
router.post('/profile/schedule', requireAdmin, async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { slug: 'main' },
      { $push: { schedule: req.body } },
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (err) {
    res.status(400).json({ error: 'Thêm lịch học thất bại', detail: err.message });
  }
});

// DELETE /api/profile/schedule/:index - xoá 1 buổi học theo vị trí trong mảng (cần admin token)
router.delete('/profile/schedule/:index', requireAdmin, async (req, res) => {
  try {
    const profile = await Profile.findOne({ slug: 'main' });
    if (!profile) return res.status(404).json({ error: 'Không tìm thấy profile' });

    const idx = parseInt(req.params.index, 10);
    if (isNaN(idx) || idx < 0 || idx >= profile.schedule.length) {
      return res.status(400).json({ error: 'Vị trí không hợp lệ' });
    }
    profile.schedule.splice(idx, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    res.status(400).json({ error: 'Xoá lịch học thất bại', detail: err.message });
  }
});

// POST /api/login - kiểm tra token admin có đúng không (dùng cho form đăng nhập admin.html)
router.post('/login', (req, res) => {
  const { token } = req.body;
  if (token && token === process.env.ADMIN_TOKEN) {
    return res.json({ ok: true });
  }
  res.status(401).json({ ok: false, error: 'Token không đúng' });
});

module.exports = router;
