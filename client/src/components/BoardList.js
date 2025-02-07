import React, { useState, useEffect } from "react";
import {
  fetchPosts,
  deletePost,
  fetchPostById,
} from "../services/boardService";
import DOMPurify from "dompurify";
import BoardForm from "./BoardForm";
import "react-quill/dist/quill.snow.css";
import { useRecoilState } from "recoil";
import { editingMode, postList, postSelect } from "../atoms";

const BoardList = () => {
  const [posts, setPosts] = useRecoilState(postList);
  const [selectedPost, setSelectedPost] = useRecoilState(postSelect);
  const [isEditing, setIsEditing] = useRecoilState(editingMode);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const fetchedPosts = await fetchPosts();
        // 데이터가 배열인지 확인하고, 아니라면 빈 배열로 설정합니다.
        if (!Array.isArray(fetchedPosts)) {
          console.error(
            "Fetched posts 데이터가 배열이 아닙니다:",
            fetchedPosts
          );
          setPosts([]);
        } else {
          setPosts(fetchedPosts);
        }
      } catch (error) {
        console.error("게시물 로딩 실패:", error);
      }
    };
    loadPosts();
  }, [selectedPost, setPosts]);

  // 렌더링 전에 posts가 배열인지 확인하는 guard
  if (!Array.isArray(posts)) {
    console.error("posts가 배열이 아닙니다:", posts);
    return <div>게시물 데이터를 불러올 수 없습니다.</div>;
  }

  const fallbackImage = "https://mempro.co.kr/noImg.jpg";

  // 예시: 게시물에서 첫 번째 미디어(이미지 또는 iframe)를 추출하는 함수
  const extractFirstMedia = (htmlContent) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const images = tempDiv.querySelectorAll("img");
    const iframes = tempDiv.querySelectorAll("iframe");

    let firstMedia = null;
    if (images.length > 0 && iframes.length > 0) {
      firstMedia =
        images[0].compareDocumentPosition(iframes[0]) &
        Node.DOCUMENT_POSITION_FOLLOWING
          ? images[0]
          : iframes[0];
    } else if (images.length > 0) {
      firstMedia = images[0];
    } else if (iframes.length > 0) {
      firstMedia = iframes[0];
    }

    if (firstMedia) {
      if (firstMedia.tagName === "IMG") {
        return firstMedia.src;
      }
      // 유튜브 iframe 등일 경우 추가 처리 가능
    }
    return null;
  };

  // Sanitize HTML content
  const createSanitizedHTML = (content) => {
    return DOMPurify.sanitize(content, {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: [
        "allow",
        "allowfullscreen",
        "frameborder",
        "src",
        "width",
        "height",
      ],
    });
  };

  // 핸들러 함수들 (게시물 선택, 수정, 삭제 등)
  const handleViewPost = (post) => {
    setSelectedPost(post);
    setIsEditing(false);
  };

  const handleEditPost = () => {
    setIsEditing(true);
  };

  const handleDeletePost = async (postId) => {
    try {
      await deletePost(postId);
      setPosts(posts.filter((post) => post.id !== postId));
      setSelectedPost(null);
    } catch (error) {
      console.error("게시물 삭제 실패:", error);
    }
  };

  const handlePostUpdated = async (updatedPost) => {
    try {
      const refreshedPost = await fetchPostById(updatedPost.id);
      setPosts(
        posts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
      );
      setSelectedPost(updatedPost);
      alert("수정 완료");
      setIsEditing(false);
    } catch (error) {
      console.error("게시물 수정 실패:", error);
    }
  };

  return (
    <div>
      {selectedPost ? (
        <div>
          {isEditing ? (
            <BoardForm
              initialPost={selectedPost}
              onPostCreated={handlePostUpdated}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div>
              <h2>{selectedPost.title}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: createSanitizedHTML(selectedPost.content),
                }}
                style={{
                  border: "1px solid #ddd",
                  padding: "15px",
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9",
                  minHeight: "200px",
                }}
              />
              <button onClick={handleEditPost}>수정</button>
              <button onClick={() => handleDeletePost(selectedPost.id)}>
                삭제
              </button>
              <button onClick={() => setSelectedPost(null)}>목록으로</button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2>게시물 목록</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {posts.map((post) => {
              const firstImage = extractFirstMedia(post.content);
              return (
                <div
                  key={post.id}
                  onClick={() => handleViewPost(post)}
                  style={{
                    cursor: "pointer",
                    textAlign: "center",
                    width: "120px",
                    padding: "10px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={firstImage || fallbackImage}
                    alt="썸네일"
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                    }}
                  />
                  <h3 style={{ marginTop: "8px", fontSize: "14px" }}>
                    {post.title}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardList;
