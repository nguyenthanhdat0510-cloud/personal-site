const mongoose = require('mongoose');

const ScheduleItemSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },       // vd: "Thứ 2"
    start: { type: String, required: true },      // vd: "07:00"
    end: { type: String, required: true },        // vd: "09:30"
    subject: { type: String, required: true },    // vd: "Hệ thống nhúng"
    room: { type: String, default: '' },          // vd: "D3-401"
    note: { type: String, default: '' }
  },
  { _id: false }
);

const SocialLinksSchema = new mongoose.Schema(
  {
    facebook: { type: String, default: '' },
    tiktok: { type: String, default: '' },
    instagram: { type: String, default: '' }
  },
  { _id: false }
);

const ProfileSchema = new mongoose.Schema(
  {
    // Dùng slug cố định "main" để luôn chỉ có 1 document profile duy nhất
    slug: { type: String, default: 'main', unique: true },
    name: { type: String, required: true },
    title: { type: String, default: '' },
    bio: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    socials: { type: SocialLinksSchema, default: () => ({}) },
    schedule: { type: [ScheduleItemSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', ProfileSchema);
