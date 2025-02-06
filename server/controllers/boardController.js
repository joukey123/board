const fs = require("fs").promises;
const path = require("path");

const DATA_FILE = path.join(__dirname, "../data/api/posts.json");
// const DATA_FILE = "http://mempro.co.kr/uploads/board/api/posts.json";

exports.getPosts = async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, "utf8");
    const posts = JSON.parse(data);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "게시물을 불러오는 데 실패했습니다." });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const data = await fs.readFile(DATA_FILE, "utf8");
    const posts = JSON.parse(data);

    const newPost = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: new Date().toISOString(),
    };

    posts.unshift(newPost);
    await fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2));

    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ message: "게시물 작성에 실패했습니다." });
  }
};
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const data = await fs.readFile(DATA_FILE, "utf8");
    let posts = JSON.parse(data);

    const postIndex = posts.findIndex((post) => String(post.id) === String(id));

    if (postIndex === -1) {
      return res.status(404).json({ message: "게시물을 찾을 수 없습니다." });
    }

    // 게시물 업데이트
    posts[postIndex] = {
      ...posts[postIndex],
      title,
      content,
      updatedAt: new Date().toISOString(),
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2));
    res.json(posts[postIndex]);
  } catch (error) {
    res.status(500).json({ message: "게시물 수정 중 오류 발생" });
  }
};

exports.deletePost = async (req, res) => {
  const postId = req.params.id;
  try {
    // 1. JSON 파일에서 게시물 목록 읽기
    const data = await fs.readFile(DATA_FILE, "utf8");
    const posts = JSON.parse(data);

    // 2. 삭제할 게시물 찾기
    const postIndex = posts.findIndex((post) => post.id === postId);
    if (postIndex === -1) {
      return res.status(404).json({ message: "게시물을 찾을 수 없습니다." });
    }

    const postToDelete = posts[postIndex];

    // 3. 게시물 콘텐츠에서 이미지 URL 추출
    const imageUrlRegex =
      /<img\s+src=["'](http:\/\/localhost:5001\/uploads\/images\/[^"']+)["'][^>]*>/g;
    let match;
    const imageUrls = [];
    while ((match = imageUrlRegex.exec(postToDelete.content)) !== null) {
      imageUrls.push(match[1]);
    }

    // 4. 각 이미지 URL에 해당하는 파일 삭제
    for (const url of imageUrls) {
      const fileName = path.basename(url); // 파일명 추출
      // 수정된 경로: controllers 폴더에서 상위 폴더(data/uploads/images)로 이동
      const filePath = path.join(
        __dirname,
        "..",
        "data",
        "uploads",
        "images",
        fileName
      );
      try {
        await fs.unlink(filePath);
        console.log(`Deleted file: ${filePath}`);
      } catch (err) {
        console.error(`파일 삭제 오류 (${filePath}):`, err);
      }
    }
    // 5. 게시물 목록에서 해당 게시물 삭제 후 JSON 파일 업데이트
    posts.splice(postIndex, 1);
    await fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2));
    res.json({ message: "게시물과 관련 이미지가 삭제되었습니다." });
  } catch (error) {
    console.error("게시물 삭제 중 오류 발생:", error);
    res.status(500).json({ message: "게시물 삭제에 실패했습니다." });
  }
};
