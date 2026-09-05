const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const Comment = require('../models/Comment');

// Middleware kiểm tra token admin (đọc từ header "x-admin-token")
function requireAdmin(req, res, next) {
  const token = req.header('x-admin-token');
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Sai hoặc thiếu mật khẩu quản trị' });
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
  res.status(401).json({ ok: false, error: 'Mật khẩu không đúng' });
});

// GET /api/comments - chỉ hiển thị những lời nhắn đã được admin duyệt
router.get('/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ approved: true }).sort({ createdAt: -1 }).lean();
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Không thể tải lời nhắn' });
  }
});

// POST /api/comments - lời nhắn mới luôn chờ duyệt
router.post('/comments', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const message = String(req.body.message || '').trim();
    if (!name || !message) return res.status(400).json({ error: 'Vui lòng nhập tên và lời nhắn' });
    if (name.length > 80 || message.length > 1000) return res.status(400).json({ error: 'Lời nhắn vượt quá độ dài cho phép' });
    await Comment.create({ name, message });
    res.status(201).json({ ok: true, message: 'Lời nhắn đã được gửi và đang chờ duyệt.' });
  } catch (err) {
    res.status(400).json({ error: 'Không thể gửi lời nhắn' });
  }
});

// Các API kiểm duyệt chỉ dành cho admin.
router.get('/comments/pending', requireAdmin, async (req, res) => {
  try {
    const comments = await Comment.find({ approved: false }).sort({ createdAt: -1 }).lean();
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Không thể tải lời nhắn chờ duyệt' });
  }
});

router.patch('/comments/:id/approve', requireAdmin, async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    if (!comment) return res.status(404).json({ error: 'Không tìm thấy lời nhắn' });
    res.json(comment);
  } catch (err) {
    res.status(400).json({ error: 'Không thể duyệt lời nhắn' });
  }
});

router.delete('/comments/:id', requireAdmin, async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Không tìm thấy lời nhắn' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Không thể xoá lời nhắn' });
  }
});

module.exports = router;
