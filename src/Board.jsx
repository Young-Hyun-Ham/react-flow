import { useState, useEffect } from 'react';
import { db, storage } from './firebase';
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import styles from './Board.module.css';
import useAlert from './hooks/useAlert';

// Simple SVG Icons for file types
const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
);
const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
);


function Board({ user }) {
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editText, setEditText] = useState('');
  const { showAlert, showConfirm } = useAlert();

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
    // --- 💡 수정된 부분: 로그인하지 않은 사용자는 제출 불가 ---
    if (!user) {
      showAlert("Please log in to write a post.");
      return;
    }
    if (!newPostText.trim() && !fileToUpload) {
      showAlert("Please enter some text or select a file.");
      return;
    }

    setIsLoading(true);

    let fileUrl = '';
    let fileName = '';
    let fileType = '';

    if (fileToUpload) {
      const storageRef = ref(storage, `uploads/${user.uid}/${Date.now()}_${fileToUpload.name}`);
      try {
        const snapshot = await uploadBytes(storageRef, fileToUpload);
        fileUrl = await getDownloadURL(snapshot.ref);
        fileName = fileToUpload.name;
        fileType = fileToUpload.type.startsWith('image/') ? 'image' : 'file';
      } catch (error) {
        console.error("Error uploading file: ", error);
        showAlert("File upload failed!");
        setIsLoading(false);
        return;
      }
    }

    try {
      await addDoc(collection(db, 'posts'), {
        author: user.displayName,
        authorId: user.uid,
        authorPhotoURL: user.photoURL,
        text: newPostText,
        timestamp: serverTimestamp(),
        fileUrl,
        fileName,
        fileType,
      });

      setNewPostText('');
      setFileToUpload(null);
      if(document.getElementById('fileInput')) {
        document.getElementById('fileInput').value = '';
      }
    } catch (error) {
      console.error("Error adding document: ", error);
      showAlert("Failed to create post.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (post) => {
    // --- 💡 수정된 부분: 로그인하지 않은 사용자는 삭제 불가 ---
    if (!user) {
      showAlert("Please log in to delete a post.");
      return;
    }
    if (post.authorId !== user.uid) {
      showAlert("You can only delete your own posts.");
      return;
    }

    const confirmed = await showConfirm("정말로 이 게시물을 삭제하시겠습니까?");
    if (!confirmed) {
      return;
    }

    try {
      if (post.fileUrl) {
        const fileRef = ref(storage, post.fileUrl);
        await deleteObject(fileRef);
      }
      await deleteDoc(doc(db, 'posts', post.id));
    } catch (error) {
      console.error("Error deleting post: ", error);
      showAlert("게시물 삭제에 실패했습니다.");
    }
  };

  const handleEditClick = (post) => {
    // --- 💡 수정된 부분: 로그인하지 않은 사용자는 수정 모드 진입 불가 ---
    if (!user) {
        showAlert("Please log in to edit a post.");
        return;
    }
    setEditingPostId(post.id);
    setEditText(post.text);
  };

  const handleUpdatePost = async (postId) => {
    const postRef = doc(db, 'posts', postId);
    try {
      await updateDoc(postRef, {
        text: editText
      });
      setEditingPostId(null);
      setEditText('');
    } catch (error) {
      console.error("Error updating post: ", error);
      showAlert("게시물 수정에 실패했습니다.");
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditText('');
  };


  return (
    <div className={styles.boardContainer}>
      {/* --- 💡 수정된 부분: 로그인 상태에 따라 글쓰기 폼 렌더링 --- */}
      {user ? (
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
      ) : (
        <div className={styles.postForm} style={{textAlign: 'center', padding: '30px'}}>
            <p>Please log in to write posts.</p>
        </div>
      )}

      {posts.length === 0 && !isLoading && <div className={styles.loading}>No posts yet. Be the first!</div>}

      <div className={styles.postList}>
        {posts.map((post) => (
          <div key={post.id} className={styles.post}>
            <div className={styles.postHeader}>
              <div className={styles.authorSection}>
                <img src={post.authorPhotoURL} alt={post.author} className={styles.avatar} />
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>{post.author || 'Anonymous'}</span>
                  <span className={styles.timestamp}>
                    {post.timestamp?.toDate().toLocaleString()}
                  </span>
                </div>
              </div>
              {user && user.uid === post.authorId && (
                <div className={styles.buttonGroup}>
                   <button onClick={() => handleEditClick(post)} className={styles.editButton}>
                    수정
                  </button>
                  <button onClick={() => handleDeletePost(post)} className={styles.deleteButton}>
                    &times;
                  </button>
                </div>
              )}
            </div>
            <div className={styles.postContent}>
              {editingPostId === post.id ? (
                <div className={styles.editForm}>
                  <textarea
                    className={styles.editTextarea}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <div className={styles.editActions}>
                    <button onClick={() => handleUpdatePost(post.id)} className={styles.saveButton}>저장</button>
                    <button onClick={handleCancelEdit} className={styles.cancelButton}>취소</button>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Board;