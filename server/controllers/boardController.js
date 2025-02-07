const fs = require("fs").promises;
const path = require("path");

const DATA_FILE = path.join(__dirname, "../data/api/posts.json");
// const DATA_FILE = "http://mempro.co.kr/uploads/board/api/posts.json";
exports.getPosts = async (req, res) => {
  try {
    // 파일 존재 여부 확인
    if (!fs.existsSync(DATA_FILE)) {
      return res
        .status(404)
        .json({ message: "데이터 파일이 존재하지 않습니다.", path: DATA_FILE });
    }

    const data = await fs.readFile(DATA_FILE, "utf8");
    const posts = JSON.parse(data);
    res.json(posts);
  } catch (error) {
    console.error("게시물을 불러오는 중 오류 발생:", error);
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
  try {
    const { id } = req.params;
    const data = await fs.readFile(DATA_FILE, "utf8");
    let posts = JSON.parse(data);
    const filteredPosts = posts.filter(
      (post) => String(post.id) !== String(id)
    );
    await fs.writeFile(DATA_FILE, JSON.stringify(filteredPosts, null, 2));
    res.json({ message: "게시물이 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "게시물 삭제 중 오류 발생" });
  }
};
