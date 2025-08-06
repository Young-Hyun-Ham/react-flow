import { useState, useEffect } from 'react';
import { db, storage } from './firebase';
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import styles from './Board.module.css';

// Simple SVG Icons for file types
const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
);
const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
);


function Board() {
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch posts from Firestore in real-time
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData = [];
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() });
      });
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() && !fileToUpload) {
      alert("Please enter some text or select a file.");
      return;
    }

    setIsLoading(true);

    let fileUrl = '';
    let fileName = '';
    let fileType = '';

    // Upload file to Firebase Storage if it exists
    if (fileToUpload) {
      const storageRef = ref(storage, `uploads/${Date.now()}_${fileToUpload.name}`);
      try {
        const snapshot = await uploadBytes(storageRef, fileToUpload);
        fileUrl = await getDownloadURL(snapshot.ref);
        fileName = fileToUpload.name;
        fileType = fileToUpload.type.startsWith('image/') ? 'image' : 'file';
      } catch (error) {
        console.error("Error uploading file: ", error);
        alert("File upload failed!");
        setIsLoading(false);
        return;
      }
    }

    // Add new post document to Firestore
    try {
      await addDoc(collection(db, 'posts'), {
        author: 'User', // In a real app, this would be the logged-in user's name
        text: newPostText,
        timestamp: serverTimestamp(),
        fileUrl,
        fileName,
        fileType,
      });

      // Reset form state
      setNewPostText('');
      setFileToUpload(null);
      if(document.getElementById('fileInput')) {
        document.getElementById('fileInput').value = '';
      }
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to create post.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 💡 추가된 부분: 게시물 삭제 함수 ---
  const handleDeletePost = async (postId, fileUrl) => {
    if (!window.confirm("정말로 이 게시물을 삭제하시겠습니까?")) {
      return;
    }

    try {
      // 게시물에 첨부된 파일이 있으면 Storage에서 삭제
      if (fileUrl) {
        const fileRef = ref(storage, fileUrl);
        await deleteObject(fileRef);
      }

      // Firestore에서 게시물 문서 삭제
      await deleteDoc(doc(db, 'posts', postId));
    } catch (error) {
      console.error("Error deleting post: ", error);
      alert("게시물 삭제에 실패했습니다.");
    }
  };

  return (
    <div className={styles.boardContainer}>
      <form className={styles.postForm} onSubmit={handlePostSubmit}>
        <textarea
          className={styles.textarea}
          value={newPostText}
          onChange={(e) => setNewPostText(e.target.value)}
          placeholder="What's on your mind?"
        />
        <div className={styles.formActions}>
          <div>
            <label htmlFor="fileInput" className={styles.fileInputLabel}>
              <ImageIcon /> Add Photo/File
            </label>
            <input
              id="fileInput"
              type="file"
              className={styles.fileInput}
              onChange={handleFileChange}
            />
            {fileToUpload && <span className={styles.fileName}>{fileToUpload.name}</span>}
          </div>
          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>

      {posts.length === 0 && !isLoading && <div className={styles.loading}>No posts yet. Be the first!</div>}
      
      <div className={styles.postList}>
        {posts.map((post) => (
          <div key={post.id} className={styles.post}>
            <div className={styles.postHeader}>
              <div className={styles.authorSection}>
                <div className={styles.avatar}>{post.author ? post.author.charAt(0) : 'U'}</div>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>{post.author || 'Anonymous'}</span>
                  <span className={styles.timestamp}>
                    {post.timestamp?.toDate().toLocaleString()}
                  </span>
                </div>
              </div>
              {/* --- 💡 추가된 부분: 삭제 버튼 --- */}
              <button onClick={() => handleDeletePost(post.id, post.fileUrl)} className={styles.deleteButton}>
                &times;
              </button>
            </div>
            <div className={styles.postContent}>
              {post.text && <p>{post.text}</p>}
              {post.fileType === 'image' && (
                <img src={post.fileUrl} alt="Post content" className={styles.postImage} />
              )}
              {post.fileType === 'file' && (
                <div className={styles.postFile}>
                  <FileIcon />
                  <a href={post.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                    {post.fileName}
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Board;
