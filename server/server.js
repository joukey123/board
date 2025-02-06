const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();

// CORS 설정
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 요청 크기 제한 증가
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/", (req, res) => {
  res.send("게시판 서버가 정상적으로 실행 중입니다.");
});

// 정적 파일 제공 경로 설정
const clientPublicPath = path.join(__dirname, "../client/public");
app.use(express.static(clientPublicPath));

const uploadsPath = path.join(clientPublicPath, "uploads");
app.use("/uploads", express.static(uploadsPath));

// 업로드 폴더 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = uploadsPath;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
});

// 이미지 업로드 API
// app.post("/api/upload", upload.single("image"), (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "이미지 업로드 실패" });
//     }

//     // 이미지 URL 반환
//     const imageUrl = `http://localhost:5001/uploads/${req.file.filename}`;
//     alert("upload");
//     res.json({ message: "이미지 업로드 성공", imageUrl });
//   } catch (error) {
//     console.error("이미지 업로드 중 오류:", error);
//     res.status(500).json({ message: "서버 오류", error: error.message });
//   }
// });

// 게시판 라우트 연결
const boardRoutes = require("./routes/boardRoutes");

app.use("/api/board", boardRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
});
