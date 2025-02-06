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
  // base64를 Blob으로 변환하는 함수
  const base64ToBlob = (base64) => {
    const byteString = atob(base64.split(",")[1]);
    const mimeString = base64.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };
  // 게시물 저장 (새 글 작성)

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const base64Images = Array.from(
        content.matchAll(
          /<img src="data:(image\/[a-zA-Z]+);base64,(.*?)"[^>]*>/g
        )
      );

      const uploadedImages = await Promise.all(
        base64Images.map(async (match, index) => {
          const mimeType = match[1]; // 예: image/png
          const base64String = `data:${mimeType};base64,${match[2]}`;
          const blob = base64ToBlob(base64String);

          const extension = mimeType.split("/")[1]; // 확장자 추출 (png, jpeg 등)
          const fileName = `image_${Date.now()}_${index}.${extension}`;

          const formData = new FormData();
          formData.append("image", blob, fileName);

          const response = await axios.post(
            "http://localhost:5001/api/upload",
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );

          return { base64String, serverUrl: response.data.imageUrl };
        })
      );

      // 콘텐츠에서 base64 이미지를 서버 URL로 대체
      let processedContent = content;
      uploadedImages.forEach(({ base64String, serverUrl }) => {
        processedContent = processedContent.replace(base64String, serverUrl);
      });

      // 게시물 저장 요청
      await axios.post("http://localhost:5001/api/board", {
        title,
        content: processedContent,
      });

      alert("게시물이 성공적으로 저장되었습니다!");

      setTitle("");
      setContent("");
      const updatedPosts = await fetchPosts();

      setPosts(updatedPosts);
    } catch (error) {
      console.error("게시물 저장 중 오류 발생:", error);
      alert("게시물 저장에 실패했습니다.");
    }
  };
  // 게시물 수정
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // 콘텐츠 내에서 base64 이미지 태그 추출 (mime 타입과 base64 데이터 캡쳐)
      const base64Images = Array.from(
        content.matchAll(
          /<img src="data:(image\/[a-zA-Z]+);base64,(.*?)"[^>]*>/g
        )
      );

      // base64 이미지를 서버에 업로드 후 URL을 받아옴
      const uploadedImages = await Promise.all(
        base64Images.map(async (match, index) => {
          const mimeType = match[1]; // 예: image/png
          // 재구성: data:image/png;base64,AAA...
          const base64String = `data:${mimeType};base64,${match[2]}`;
          const blob = base64ToBlob(base64String);
          const extension = mimeType.split("/")[1]; // png, jpeg 등
          const fileName = `image_${Date.now()}_${index}.${extension}`;
          const formData = new FormData();
          formData.append("image", blob, fileName);

          const response = await axios.post(
            "http://localhost:5001/api/upload",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );

          return { base64String, serverUrl: response.data.imageUrl };
        })
      );

      // 콘텐츠 내 base64 이미지 부분을 서버 URL로 대체
      let processedContent = content;
      uploadedImages.forEach(({ base64String, serverUrl }) => {
        // 단순 문자열 치환 (필요에 따라 정규표현식 등으로 보완 가능)
        processedContent = processedContent.replace(base64String, serverUrl);
      });

      // 수정된 게시물 내용 서버 업데이트 요청 (PUT API 예시)
      const updatedPost = await axios.put(
        `http://localhost:5001/api/board/${initialPost.id}`,
        {
          title,
          content: processedContent,
        }
      );

      // 업데이트된 결과를 상태에 반영하는 처리 (예: setSelectedPost(updatedPost.data))
      // … (상태 업데이트 코드)
      alert("게시물이 성공적으로 수정되었습니다!");
      // onPostUpdated(updatedPost);
      setSelectedPost(updatedPost.data);

      setIsEditing(false);
    } catch (error) {
      console.error("게시물 수정 중 오류 발생:", error);
      alert("게시물 수정에 실패했습니다.");
    }
  };

  // 게시물 삭제
  const handleDelete = async () => {
    if (!initialPost) return;
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await axios.delete(`http://localhost:5001/api/board/${initialPost.id}`);
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
