# Trang web cá nhân (Full-stack)

Stack: **Node.js + Express + MongoDB (Mongoose)** cho backend, HTML/CSS/JS thuần cho frontend.

Hiển thị: giới thiệu bản thân, link Facebook/TikTok/Instagram, số điện thoại, và **lịch học** (lấy từ database, chỉnh sửa được qua trang admin, không cần sửa code).

## Cấu trúc thư mục

```
personal-site/
├── server.js           # Server Express chính
├── seed.js             # Script tạo dữ liệu mẫu ban đầu
├── models/Profile.js   # Schema MongoDB (thông tin cá nhân + lịch học)
├── routes/api.js       # API: GET/PUT profile, thêm/xoá lịch học
├── public/
│   ├── index.html       # Trang chủ (công khai)
│   ├── admin.html        # Trang quản trị (cần token)
│   ├── css/style.css
│   └── js/main.js, admin.js
├── .env.example
└── package.json
```

## 1. Cài đặt local

```bash
cd personal-site
npm install
cp .env.example .env
```

Mở file `.env` và điền:
- `MONGODB_URI`: chuỗi kết nối MongoDB. Cách dễ nhất là tạo **miễn phí** một cluster tại [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register), lấy connection string dạng `mongodb+srv://...`.
- `ADMIN_TOKEN`: tự đặt một chuỗi bí mật bất kỳ, đây là "mật khẩu" để đăng nhập trang `/admin.html`.

Sau đó chạy:

```bash
npm run seed     # tạo dữ liệu mẫu (tên, học vấn, lịch học mẫu...)
npm start        # chạy server tại http://localhost:3000
```

Mở trình duyệt:
- `http://localhost:3000` → trang chủ
- `http://localhost:3000/admin.html` → trang quản trị, nhập `ADMIN_TOKEN` bạn đã đặt để đăng nhập, sau đó sửa số điện thoại, link mạng xã hội thật và lịch học thật.

## 2. Deploy lên Vercel

Vercel phù hợp cho frontend + serverless function. Vì đây là 1 Express app đơn giản, cách nhanh nhất là dùng **Render** hoặc **Railway** (chạy Node server bình thường, không cần chuyển sang serverless). Nếu vẫn muốn Vercel:

1. Cài `vercel` CLI: `npm i -g vercel`
2. Thêm file `vercel.json` trỏ toàn bộ request vào `server.js` làm serverless function.
3. Khai báo biến môi trường `MONGODB_URI`, `ADMIN_TOKEN` trong Vercel Dashboard → Settings → Environment Variables.

## 3. Deploy lên Render (khuyến nghị, dễ nhất)

1. Đẩy code này lên một repo GitHub.
2. Vào [render.com](https://render.com) → New → Web Service → chọn repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Tab Environment → thêm `MONGODB_URI` và `ADMIN_TOKEN`.
6. Sau khi deploy xong, vào Render Shell (hoặc chạy `npm run seed` local với cùng `MONGODB_URI`) để tạo dữ liệu ban đầu.

## 4. Deploy lên VPS

```bash
git clone <repo-cua-ban>
cd personal-site
npm install --production
cp .env.example .env   # rồi điền giá trị thật
npm run seed
npm install -g pm2
pm2 start server.js --name personal-site
pm2 save
```

Dùng Nginx làm reverse proxy trỏ domain về `localhost:3000`, và cấu hình SSL bằng Certbot nếu cần HTTPS.

## Ghi chú bảo mật

- `ADMIN_TOKEN` chỉ nên chia sẻ với chính bạn — ai có token này đều sửa được nội dung trang.
- File `.env` **không** commit lên Git (đã có `.gitignore`).
- Nếu deploy public, nên đổi `ADMIN_TOKEN` thành chuỗi dài, ngẫu nhiên (vd dùng `openssl rand -hex 32`).
