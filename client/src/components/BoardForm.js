import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { fetchPosts, updatePost } from "../services/boardService";
import { useRecoilState } from "recoil";
import { editingMode, postList, postSelect } from "../atoms";

const BoardForm = ({ initialPost = null, onPostCreated, onCancel }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tempImages, setTempImages] = useState([]);
  const quillRef = useRef(null);
  const [isEditing, setIsEditing] = useRecoilState(editingMode);
  const [posts, setPosts] = useRecoilState(postList);
  const [selectedPost, setSelectedPost] = useRecoilState(postSelect);
  const Base_URL = process.env.REACT_APP_SERVER_URL;

  useEffect(() => {
    if (initialPost) {
      setTitle(initialPost.title);
      setContent(initialPost.content);
    }
  }, [initialPost]);

  // 이미지 업로드 핸들러
  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 업로드할 수 있습니다.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("파일 크기는 5MB를 초과할 수 없습니다.");
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result;
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, "image", base64);
        }
      };
    };
  }, []);

  // Quill 모듈 설정
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image", "video"],
          ["clean"],
        ],
        handlers: { image: imageHandler },
      },
    }),
    [imageHandler]
  );

  const formats = [
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "image",
    "video",
  ];

  // 게시물 저장 (새 글 작성)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 이미지 업로드
      const uploadedImages = await Promise.all(
        tempImages.map(async (img) => {
          const formData = new FormData();
          formData.append("image", img.file);

          // const response = await axios.post(
          //   "http://localhost:5001/api/upload",
          //   formData,
          //   {
          //     headers: { "Content-Type": "multipart/form-data" },
          //   }
          // );

          return { tempUrl: img.tempUrl, serverUrl: response.data.imageUrl };
        })
      );

      // 콘텐츠에서 임시 이미지 URL을 서버 이미지 URL로 변환
      let processedContent = content;
      uploadedImages.forEach((img) => {
        processedContent = processedContent.replace(img.tempUrl, img.serverUrl);
      });

      // 게시물 생성
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}api/board`,
        {
          title,
          content: processedContent,
        }
      );

      // onPostCreated(response.data);
      setTitle("");
      setContent("");
      setTempImages([]);
      const updateList = await fetchPosts();
      setPosts(updateList); // 수정된 게시물 표시
    } catch (error) {
      console.error("게시물 작성 중 오류 발생:", error);
      alert("게시물 작성에 실패했습니다.");
    }
  };

  // 게시물 수정
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!initialPost) return;

    try {
      // 이미지 업로드 처리
      const uploadedImages = await Promise.all(
        tempImages.map(async (img) => {
          const formData = new FormData();
          formData.append("image", img.file);

          const response = await axios.put(
            `http://mempro.co.kr:3000/api/upload`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );

          return { tempUrl: img.tempUrl, serverUrl: response.data.imageUrl };
        })
      );

      // 본문 내 이미지 URL 변경
      let updatedContent = content;
      uploadedImages.forEach((img) => {
        updatedContent = updatedContent.replace(img.tempUrl, img.serverUrl);
      });

      // 게시물 수정 요청
      const updatedPost = await updatePost(
        initialPost.id,
        title,
        updatedContent
      );

      // onPostUpdated(updatedPost);
      setSelectedPost(updatedPost);

      setIsEditing(false);
    } catch (error) {
      alert("게시물 수정에 실패했습니다.");
    }
  };

  // 게시물 삭제
  const handleDelete = async () => {
    if (!initialPost) return;
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await axios.delete(
        `http://mempro.co.kr:3000/api/board/${initialPost.id}`
      );
    } catch (error) {
      console.error("게시물 삭제 중 오류 발생:", error);
      alert("게시물 삭제에 실패했습니다.");
    }
  };

  return (
    <form onSubmit={isEditing ? handleUpdate : handleSubmit}>
      <input
        type="text"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <ReactQuill
        ref={quillRef}
        value={content}
        onChange={setContent}
        modules={modules}
        formats={formats}
        placeholder="내용을 작성하세요"
      />
      <button type="submit">{isEditing ? "완료" : "작성"}</button>
      {initialPost && (
        <>
          <button type="button" onClick={onCancel}>
            취소
          </button>
        </>
      )}
    </form>
  );
};

export default BoardForm;
