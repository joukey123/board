import React, { useState, useEffect, useMemo } from "react";
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
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("게시물 로딩 실패:", error);
      }
    };
    loadPosts();
  }, [selectedPost]);

  // 📌 게시물 선택 (상세 보기)
  const handleViewPost = (post) => {
    setSelectedPost(post);
    setIsEditing(false);
  };

  // 📌 수정 모드로 전환
  const handleEditPost = () => {
    setIsEditing(true);
  };

  // 📌 게시물 삭제
  const handleDeletePost = async (postId) => {
    try {
      await deletePost(postId);
      setPosts(posts.filter((post) => post.id !== postId));
      setSelectedPost(null);
    } catch (error) {
      console.error("게시물 삭제 실패:", error);
    }
  };

  // 📌 게시물 수정 완료 시 상세 보기로 전환
  const handlePostUpdated = async (updatedPost) => {
    console.log(updatedPost, "pup");
    const refreshedPost = await fetchPostById(updatedPost.id);
    setPosts(
      posts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
    setSelectedPost(updatedPost);
    // ✅ 수정 완료 메시지 후 상세 보기로 이동
    alert("수정 완료");
    setIsEditing(false);
  };

  // 📌 게시물에서 첫 번째 이미지를 추출하는 함수
  // const extractFirstImage = (htmlContent) => {
  //   const tempDiv = document.createElement("div");
  //   tempDiv.innerHTML = htmlContent;
  //   const imgTag = tempDiv.querySelector("img");
  //   return imgTag ? imgTag.src : null;
  // };

  const fallbackImage = "https://mempro.co.kr/noImg.jpg"; // 기본 대체 이미지

  //유튜브 동영상 아이디 구하기
  const extractYouTubeId = (iframeSrc) => {
    const regex = /youtube\.com\/embed\/([^?]+)/;
    const match = iframeSrc.match(regex);
    return match ? match[1] : null;
  };
  // 📌 게시물에서 첫 번째 이미지를 추출하는 함수

  const extractFirstMedia = (htmlContent) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    // 모든 이미지와 iframe 태그를 배열로 가져오기
    const images = tempDiv.querySelectorAll("img");
    const iframes = tempDiv.querySelectorAll("iframe");

    // 이미지와 iframe 중 가장 먼저 나오는 요소를 반환
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

    // 썸네일 URL 생성
    if (firstMedia) {
      if (firstMedia.tagName === "IMG") {
        return firstMedia.src; // 이미지일 경우 이미지 URL 반환
      } else if (
        firstMedia.tagName === "IFRAME" &&
        firstMedia.src.includes("youtube.com")
      ) {
        const videoId = extractYouTubeId(firstMedia.src);
        return videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : null;
      }
    }
    return null;
  };

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

  return (
    <div>
      {/* 📌 게시물 상세 보기 OR 수정 */}
      {selectedPost ? (
        <div>
          {isEditing ? (
            // 🔹 편집 모드 (Quill 에디터)
            <div>
              <BoardForm
                initialPost={selectedPost}
                onPostCreated={handlePostUpdated}
                onCancel={() => setIsEditing(false)}
              />
            </div>
          ) : (
            // 🔹 상세 보기 모드
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
              {/* 🔹 수정 버튼 → 편집 모드에서는 "완료"로 변경 */}
              <button onClick={handleEditPost}>수정</button>
              <button onClick={() => handleDeletePost(selectedPost.id)}>
                삭제
              </button>
              <button onClick={() => setSelectedPost(null)}>목록으로</button>
            </div>
          )}
        </div>
      ) : (
        // 📌 게시물 목록 화면
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
                  {/* {firstImage ? (
                    <img
                      src={firstImage || fallbackImage}
                      alt="썸네일"
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100px",
                        height: "100px",
                        backgroundColor: "#007bff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "8px",
                        color: "white",
                        fontSize: "14px",
                      }}
                    >
                      NO IMAGE
                    </div>
                  )} */}
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
