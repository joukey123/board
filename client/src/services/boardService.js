import axios from "axios";

const API_URL = `${process.env.REACT_APP_BASE_URL}/api/board`;

export const fetchPosts = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("게시물 불러오기 실패:", error);
    throw error;
  }
};

// export const createPost = async (title, content) => {
//   try {
//     const response = await axios.post(API_URL, { title, content });
//     return response.data;
//   } catch (error) {
//     console.error("게시물 작성 실패:", error);
//     throw error;
//   }
// };
export const updatePost = async (id, title, content) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, { title, content });
    return response.data;
  } catch (error) {
    console.error("게시물 수정 실패:", error);
    throw error;
  }
};

export const deletePost = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("서버 오류: 삭제 실패", response.status);
      throw new Error(`삭제 실패: ${response.statusText}`);
    }
  } catch (error) {
    console.error("게시물 삭제 실패:", error.response?.data || error.message);
    throw error;
  }
};

export const fetchPostById = async (postId) => {
  const response = await fetch(`/api/posts/${postId}`);
  if (!response.ok) {
    throw new Error("게시물 불러오기 실패");
  }
  return response.json();
};
