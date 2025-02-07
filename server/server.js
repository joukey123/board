const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const boardRoutes = require("./routes/boardRoutes");

const app = express();

// CORS 설정
app.use(
  cors({
    origin: `${process.env.BASE_URL}`,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 요청 크기 제한 증가
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 1. API 라우트 등록 (API 요청은 이곳에서 처리)
app.use("/api/board", boardRoutes);

// 2. 정적 파일 제공 미들웨어 등록
// Express 서버 내의 public 폴더 (React 빌드 산출물)
app.use(express.static(path.join(__dirname, "public")));

// 클라이언트 정적 파일 (예: ../client/public) - 필요하다면
const clientPublicPath = path.join(__dirname, "../client/public");
app.use(express.static(clientPublicPath));

// 업로드 정적 파일 제공 (예: uploads 폴더)
const uploadsPath = path.join(clientPublicPath, "uploads");
app.use("/uploads", express.static(uploadsPath));

// 3. catch-all 라우트 (위에서 처리되지 않은 모든 요청에 대해 React 앱 index.html 반환)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Multer 설정 (업로드 폴더 설정 등)
// (이 부분은 API 라우트에 필요한 경우 별도로 /api/upload 라우트로 등록하거나 boardRoutes 내에서 처리할 수 있습니다)
// 예시로, 아래는 주석 처리된 코드이므로 필요하다면 해당 부분을 API 라우트 전에 등록해야 합니다.
/*
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

// 예시 이미지 업로드 API
app.post("/api/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "이미지 업로드 실패" });
    }
    const imageUrl = `http://www.mempro.co.kr:3000/uploads/${req.file.filename}`;
    res.json({ message: "이미지 업로드 성공", imageUrl });
  } catch (error) {
    console.error("이미지 업로드 중 오류:", error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
});
*/

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
});
