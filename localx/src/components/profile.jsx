import React, { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import axios from "axios";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";


const Post = ({ post, user, handleLike, handleAddComment }) => {
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(false);
    const isLiked = post.likes.includes(user.uid);

    const handleCommentSubmit = () => {
        if (commentText.trim()) {
            handleAddComment(post._id, commentText);
            setCommentText('');
        }
    };

    return (
        <article
            key={post._id}
            className="bg-white rounded-2xl shadow p-4 hover:shadow-md transition"
        >
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-semibold text-sky-700">
                        {post.userId === user.uid 
                            ? "You" 
                            : post.username || post.userId || "User"
                        }
                    </h3>
                    <p className="text-slate-700 mt-1 whitespace-pre-wrap">{post.text}</p>
                    {post.mediaUrl && (
                     <div className="mt-3">
                       {post.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video
                        controls
                       className="rounded-lg max-h-96 w-full object-cover"
                            src={post.mediaUrl}
                           />
                           ) : (
                         <img
                         src={post.mediaUrl}
                          alt="Post media"
                           className="rounded-lg max-h-96 w-full object-cover"
                             />
                                 )}
                                </div>
                                  )}

                </div>
                <span className="text-xs text-slate-400">
                    {new Date(post.createdAt).toLocaleString()}
                </span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
                <div className="flex space-x-4">
                    <span className="font-medium text-slate-700">
                        {post.likes.length} Likes
                    </span>
                    <span className="font-medium text-slate-700">
                        {post.comments.length} Comments
                    </span>
                </div>

                <div className="flex space-x-4">
                    <button 
                        onClick={() => handleLike(post._id)}
                        className={`font-semibold transition ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                    >
                        {isLiked ? '♥ Liked' : '♡ Like'}
                    </button>
                    <button 
                        onClick={() => setShowComments(!showComments)}
                        className="hover:text-sky-500"
                    >
                        Comment
                    </button>
                </div>
            </div>

            {showComments && (
                <div className="mt-4 bg-slate-50 p-3 rounded-lg">
                    <div className="flex space-x-2 mb-3">
                        <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="flex-grow border border-slate-200 rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-200"
                        />
                        <button 
                            onClick={handleCommentSubmit}
                            className="bg-sky-500 text-white px-3 py-1 rounded-full text-sm hover:bg-sky-600"
                        >
                            Send
                        </button>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {post.comments.map((comment, index) => (
                            <div key={index} className="text-xs">
                                <span className="font-semibold text-sky-700 mr-2">
                                    {comment.username || 'User'}
                                </span>
                                <span className="text-slate-700">{comment.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </article>
    );
};



export default function Profile() {
    const [user, setUser] = useState(auth.currentUser); 
    const [loading, setLoading] = useState(!auth.currentUser);
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [mediaFile, setMediaFile] = useState(null);
    const [notifications, setNotifications] = useState([
        { id: 1, message: "New like on your post", time: "2 minutes ago", read: false },
        { id: 2, message: "Comment on your post", time: "5 minutes ago", read: false },
        { id: 3, message: "New follower", time: "1 hour ago", read: true }
    ]);
    const [showNotifications, setShowNotifications] = useState(false); 
    const [uploading, setUploading] = useState(false);

    const [userData, setUserData] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    
    const handleLike = async (postId) => {
        if (!user) return;
        const currentPost = posts.find(p => p._id === postId);
        if (!currentPost) return;

        const isLiked = currentPost.likes.includes(user.uid);
        setPosts(posts.map(p => {
            if (p._id === postId) {
                const newLikes = isLiked
                    ? p.likes.filter(id => id !== user.uid)
                    : [...p.likes, user.uid];
                return { ...p, likes: newLikes };
            }
            return p;
        }));

        try {
            const token = await user.getIdToken();
            const formData = new FormData();
formData.append("text", newPost.trim());
if (mediaFile) {
  formData.append("media", mediaFile);
}

const res = await axios.post("/api/posts", formData, {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "multipart/form-data",
  },
});


            setPosts(posts.map(p => p._id === postId ? res.data.post : p));
        } catch (err) {
            console.error("Error toggling like, rolling back:", err);
            setPosts(posts.map(p => p._id === postId ? currentPost : p));
        }
    };

    const handleAddComment = async (postId, text) => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await axios.post(`/api/posts/comment/${postId}`, { text }, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            setPosts(posts.map(p => p._id === postId ? res.data.post : p));
        } catch (err) {
            console.error("Error adding comment:", err);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            if (!currentUser) {
                window.location.href = '/';
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                } else {
                    setUserData({
                        name: user.displayName || "Anonymous",
                        email: user.email,
                        enrollment:
                            user.displayName?.match(/\((.*?)\)/)?.[1] || "Not available",
                    });
                }
            } catch (err) {
                console.error("Error fetching user Firestore data:", err);
            } finally {
                setProfileLoading(false);
            }
        };
        fetchUserData();
    }, [user]);

    useEffect(() => {
        if (!user || loading) return;
       const fetchPosts = async () => {
         try {
      const token = await user.getIdToken();
      const searchParam = searchQuery ? `?search=${searchQuery}` : "";

       const res = await axios.get(`http://localhost:3000/api/posts${searchParam}`, {
      headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedPosts = Array.isArray(res.data) ? res.data : [];
          setPosts(fetchedPosts);
            } catch (err) {
             console.error("Error fetching posts:", err);
      setPosts([]);
  }
};
 
        fetchPosts();
    }, [user, loading, searchQuery]);

 const handlePost = async () => {
  if (!user) {
    console.error("User not logged in");
    return;
  }

  if (!newPost.trim()) {
    console.error("Post text is required");
    return;
  }

  try {
    setUploading(true);
    const token = await user.getIdToken();

    const res = await axios.post(
      "http://localhost:3000/api/posts", 
      { text: newPost.trim() },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    setPosts([res.data.post, ...posts]);
    setNewPost("");
  } catch (err) {
    console.error("❌ Error creating post:", err.response?.data || err.message);
  } finally {
    setUploading(false);
  }
};







    const handleLogout = async () => {
        await signOut(auth);
    };

    const handleChangePassword = () => {
        window.location.href = "/reset-password";
    };

    const markNotificationAsRead = (notificationId) => {
        setNotifications(prev => 
            prev.map(notif => 
                notif.id === notificationId ? { ...notif, read: true } : notif
            )
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => 
            prev.map(notif => ({ ...notif, read: true }))
        );
    };

    const unreadCount = notifications.filter(notif => !notif.read).length;

    if (loading || !user) {
        return <div className="text-center p-10 text-xl">Loading LocalX Profile...</div>;
    }

    return (
    <div className="min-h-screen w-screen bg-gray-50 text-slate-800 flex flex-col">
        {/* HEADER remains the same */}
        <header className="bg-white shadow-sm flex justify-between items-center px-8 py-4 sticky top-0 z-10">
            <div className="text-2xl font-bold text-sky-700 hidden sm:block">LocalX</div>
            <div className="flex-1 max-w-lg mx-4"> 
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search users or posts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full py-2 pl-10 pr-4 border border-slate-200 rounded-full bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                    />
                    <svg className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" 
                            fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
            </div>

           
            <div className="flex items-center space-x-4 relative">
                
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5V7a7 7 0 00-14 0v10h5l-5 5-5-5h5V7c0-5.5 4.5-10 10-10s10 4.5 10 10v10z"></path>
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    {showNotifications && (
                        <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-80 z-50 max-h-96 overflow-y-auto">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-800">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2">
                                {notifications.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-4">No notifications</p>
                                ) : (
                                    notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                                notification.read 
                                                    ? 'bg-gray-50' 
                                                    : 'bg-blue-50 border-l-4 border-blue-500'
                                            }`}
                                            onClick={() => markNotificationAsRead(notification.id)}
                                        >
                                            <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="text-slate-600 text-sm border border-slate-200 rounded-md px-3 py-1 hover:bg-slate-50"
                >
                    Edit Profile
                </button>

                {showMenu && (
                    <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-48 z-50">
                        <button
                            onClick={handleChangePassword}
                            className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                        >
                            Change Password
                        </button>
                        <button
                            onClick={handleLogout}
                            className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-md"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>

       
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            <aside className="lg:col-span-1 bg-white rounded-2xl shadow p-6 space-y-4 h-fit">
                <h2 className="text-2xl font-semibold">{user.displayName || user.email.split('@')[0] || "User"}</h2>
                <p className="text-sm text-slate-500">{user.email}</p>

                {profileLoading ? (
                    <p className="text-sm text-slate-400">Loading profile info...</p>
                ) : userData ? (
                    <>
                        <p className="text-slate-700 text-sm">
                            <strong>Name:</strong> {userData.name}
                        </p>
                        <p className="text-slate-700 text-sm">
                            <strong>Enrollment No:</strong> {userData.enrollment}
                        </p>
                    </>
                ) : (
                    <p className="text-slate-400 text-sm">No profile data available</p>
                )}

                <div className="flex items-center space-x-2 pt-2">
                    <button className="flex-1 px-3 py-2 rounded-md border border-slate-200 text-sm hover:bg-slate-50">
                        Connect
                    </button>
                    <button className="px-3 py-2 rounded-md bg-sky-600 text-white text-sm hover:bg-sky-700">
                        Message
                    </button>
                </div>
            </aside>

            {/* FEED */}
            <section className="lg:col-span-3 space-y-6 flex flex-col">
                <div className="bg-white rounded-2xl shadow p-4">
                    <textarea
                        rows="3"
                        placeholder="Share something..."
                        className="w-full resize-none border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                    />
                     <input
                          type="file"
                           accept="image/*,video/*"
                             onChange={(e) => setMediaFile(e.target.files[0])}
                                  />

                    <div className="flex items-center justify-end mt-3">
                        <button
                            onClick={handlePost}
                            disabled={!newPost.trim()}
                            className={`px-4 py-2 rounded-md text-white font-medium transition ${!newPost.trim() ? 'bg-sky-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'}`}
                        >
                            Post
                        </button>
                    </div>
                </div>

                {posts?.length === 0 ? ( 
                    <p className="text-center text-slate-500 mt-6">
                        No posts yet. Share something!
                    </p>
                ) : (
                    posts.map((post) => (
                        <Post 
                            key={post._id} 
                            post={post} 
                            user={user} 
                            handleLike={handleLike} 
                            handleAddComment={handleAddComment} 
                        />
                    ))
                )}
            </section>
        </main>
    </div>
    );
}
