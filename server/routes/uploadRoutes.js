const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// 이미지 저장 설정
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, "../../client/public/uploads");

//     // 디렉토리가 없으면 생성
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }

//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// const upload = multer({ storage: storage });

// // 이미지 업로드 라우트
// router.post("/", upload.single("image"), (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: "이미지 업로드 실패" });
//   }

//   // 클라이언트에서 접근 가능한 URL 생성
//   const imageUrl = `/uploads/${req.file.filename}`;

//   res.json({
//     message: "이미지 업로드 성공",
//     imageUrl: imageUrl,
//   });
// });

// module.exports = router;

// // server/server.js에 라우트 추가
// const uploadRoutes = require("./routes/uploadRoutes");
// app.use("/api/upload", uploadRoutes);
