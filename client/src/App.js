import React, { useState } from "react";
import BoardList from "./components/BoardList";
import BoardForm from "./components/BoardForm";
import { RecoilRoot } from "recoil";

function App() {
  const [posts, setPosts] = useState([]);

  const handlePostCreated = (newPost) => {
    setPosts([...posts, newPost]);
  };

  return (
    <RecoilRoot>
      <div>
        <h1>게시판</h1>
        <BoardForm onPostCreated={handlePostCreated} />
        <BoardList posts={posts} />
      </div>
    </RecoilRoot>
  );
}

export default App;
