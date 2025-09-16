import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TimeAgo from '../components/common/TimeAgo';
import SearchUsers from '../components/common/SearchUsers';
import {
  FaImage,
  FaTimes,
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShareAlt,
  FaPaperPlane,
  FaEllipsisH,
  FaSyncAlt,
  FaFeather,
} from 'react-icons/fa';

// Reusable IconButton component
const IconButton = ({ children, onClick, className = '', disabled, tooltip = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-3 rounded-full transition-all duration-300 transform hover:scale-110 ${className} ${
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    }`}
    aria-label={tooltip}
    title={tooltip}
  >
    {children}
  </button>
);

const CreatePost = ({ onPostCreated }) => {
  const { token, user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewImage(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.body.trim()) {
      alert('Please fill in title and description');
      return;
    }

    if (!selectedFile) {
      alert('Please select an image');
      return;
    }

    setLoading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('title', formData.title.trim());
    uploadFormData.append('body', formData.body.trim());
    uploadFormData.append('image', selectedFile);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/createPost`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      const data = await response.json();

      if (response.ok) {
        setFormData({ title: '', body: '' });
        setSelectedFile(null);
        setPreviewImage(null);
        setIsExpanded(false);
        onPostCreated();
      } else {
        alert(data.error || data.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Create post error:', error);
      alert('Failed to create post: ' + error.message);
    }
    setLoading(false);
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewImage(null);
  };

  return (
    <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 mb-8 animate-fade-in-up">
      <div className="flex items-start space-x-6">
        {user?.pic && (
          <img
            src={user.pic}
            alt="User profile"
            className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-md transform hover:scale-105 transition-transform duration-300"
          />
        )}
        <div className="flex-1">
          {!isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full text-left px-6 py-5 border border-gray-700 rounded-full bg-gray-700 text-gray-400 hover:bg-gray-700/75 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <span className="font-light">Share something...</span>
            </button>
          ) : (
            <div className="space-y-6 animate-fade-in-down">
              <input
                type="text"
                placeholder="Post title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-5 py-4 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                maxLength={100}
              />

              <textarea
                placeholder="What's on your mind?"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={4}
                className="w-full px-5 py-4 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-colors"
                maxLength={500}
              />

              {previewImage && (
                <div className="relative inline-block w-64 h-64 animate-fade-in-up">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-xl border-4 border-gray-700 shadow-lg"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-700 transition-all duration-300 shadow-xl transform hover:scale-110"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center pt-6 border-t border-gray-700">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer text-indigo-400 hover:text-indigo-300 transition-colors">
                    <FaImage className="w-6 h-6" />
                    <span className="text-sm font-light hidden sm:inline">
                      {selectedFile ? 'Change Photo' : 'Add Photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setIsExpanded(false);
                      setFormData({ title: '', body: '' });
                      setSelectedFile(null);
                      setPreviewImage(null);
                    }}
                    className="px-8 py-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-all duration-300 font-medium transform hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !formData.title.trim() || !formData.body.trim() || !selectedFile}
                    className="px-10 py-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-2xl transform hover:scale-105"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Post</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PostCard = ({ post, onNavigate, onPostUpdate }) => {
  const { user, token } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    if (post.like && user) {
      const isLiked = post.like.some(
        (likeUserId) =>
          (typeof likeUserId === 'string' && likeUserId === user._id) ||
          (typeof likeUserId === 'object' && likeUserId?._id === user._id)
      );
      setLiked(isLiked);
      setLikeCount(post.like.length);
    }
    if (post.Comment) {
      setComments(post.Comment);
    }
  }, [post, user]);

  const handleLike = async () => {
    try {
      const endpoint = liked ? '/unlike' : '/like';
      const response = await fetch(`${process.env.REACT_APP_API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId: post._id }),
      });

      const data = await response.json();
      if (response.ok) {
        setLiked(!liked);
        setLikeCount(liked ? likeCount - 1 : likeCount + 1);
      } else {
        if (onPostUpdate) onPostUpdate();
        alert(data.error || 'Failed to update like status');
      }
    } catch (error) {
      console.error('Like error:', error);
      alert('Network error occurred');
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/comment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          postId: post._id,
          text: newComment.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.result.Comment || []);
        setNewComment('');
      } else {
        const errorData = await response.json();
        console.error('Comment error:', errorData);
        alert('Failed to add comment');
      }
    } catch (error) {
      console.error('Comment error:', error);
      alert('Failed to add comment');
    }
    setCommentLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleComment();
    }
  };

  return (
    <div className="bg-gray-800 rounded-3xl shadow-2xl mb-8 transition-transform duration-300 hover:scale-[1.01] animate-fade-in-up">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={post.postedBy?.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
              alt="Profile"
              className="w-14 h-14 rounded-full object-cover cursor-pointer border-2 border-indigo-500 hover:border-indigo-400 transition-colors transform hover:scale-105"
              onClick={() => post.postedBy?._id && onNavigate('userProfile', post.postedBy._id)}
            />
            <div>
              <h4
                className="font-semibold text-gray-200 cursor-pointer hover:text-indigo-400 transition-colors text-lg"
                onClick={() => post.postedBy?._id && onNavigate('userProfile', post.postedBy._id)}
              >
                {post.postedBy?.name || 'Unknown User'}
              </h4>
              <p className="text-sm text-gray-500">
                <TimeAgo date={post.createdAt || Date.now()} />
              </p>
            </div>
          </div>
          <IconButton className="text-gray-400 hover:text-white hover:bg-gray-700" tooltip="More options">
            <FaEllipsisH className="w-5 h-5" />
          </IconButton>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-100 mb-2">{post.title}</h3>
        <p className="text-gray-400 mb-4 leading-relaxed">{post.body}</p>
        {post.photo && (
          <div className="rounded-xl overflow-hidden bg-gray-900 shadow-md">
            <img
              src={post.photo}
              alt="Post content"
              className="w-full h-auto object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-gray-500 font-light">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 transition-colors duration-300 transform hover:scale-105 ${
              liked ? 'text-red-500' : 'hover:text-red-400'
            }`}
          >
            {liked ? <FaHeart className="w-6 h-6 transform animate-bounce-in" /> : <FaRegHeart className="w-6 h-6" />}
            <span className="text-lg">{likeCount}</span>
            <span className="hidden sm:inline">Likes</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 hover:text-indigo-400 transition-colors duration-300 transform hover:scale-105"
          >
            <FaComment className="w-6 h-6" />
            <span className="text-lg">{comments.length}</span>
            <span className="hidden sm:inline">Comments</span>
          </button>

          <button className="flex items-center space-x-2 hover:text-emerald-400 transition-colors duration-300 transform hover:scale-105">
            <FaShareAlt className="w-6 h-6" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {showComments && (
        <div className="border-t border-gray-700 bg-gray-900/50 rounded-b-3xl animate-fade-in-down">
          <div className="p-6 border-b border-gray-800 bg-gray-800">
            <div className="flex space-x-4 items-start">
              <img
                src={user?.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
                alt="Your profile"
                className="w-10 h-10 rounded-full object-cover border border-gray-700 transform hover:scale-105 transition-transform duration-300"
              />
              <div className="flex-1 flex space-x-3">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={commentLoading}
                  className="flex-1 px-5 py-3 border border-gray-700 rounded-full bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                  maxLength={200}
                />
                <button
                  onClick={handleComment}
                  disabled={!newComment.trim() || commentLoading}
                  className="px-6 py-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center font-semibold transform hover:scale-105"
                >
                  {commentLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <FaPaperPlane className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {comments.length === 0 ? (
              <div className="p-6 text-center text-gray-500 animate-fade-in">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment, index) => (
                <div key={index} className="p-6 border-b border-gray-800 last:border-b-0 bg-gray-800 hover:bg-gray-700 transition-colors duration-200 animate-slide-in-up">
                  <div className="flex space-x-3">
                    <img
                      src={comment.postedBy?.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
                      alt="Commenter"
                      className="w-10 h-10 rounded-full object-cover border border-gray-700 transform hover:scale-105 transition-transform duration-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-base text-gray-300">
                          {comment.postedBy?.name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gray-500">
                          <TimeAgo date={comment.createdAt || Date.now()} />
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1 break-words">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Home = ({ onNavigate }) => {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async (showRefreshLoader = false) => {
    if (showRefreshLoader) setRefreshing(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/allpost`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        const errorData = await response.json();
        console.error('Fetch posts error:', errorData);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
    setLoading(false);
    if (showRefreshLoader) setRefreshing(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [token]);

  const handleRefresh = () => {
    fetchPosts(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <LoadingSpinner size="lg" color="indigo" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-8 animate-fade-in-down">
              <h1 className="text-4xl font-extrabold text-gray-100 tracking-tight">Home Feed</h1>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-8 py-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-md hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {refreshing ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>Refreshing</span>
                  </>
                ) : (
                  <>
                    <FaSyncAlt className="w-4 h-4" />
                    <span>Refresh</span>
                  </>
                )}
              </button>
            </div>

            <CreatePost onPostCreated={() => fetchPosts()} />

            <div className="space-y-8">
              {posts.length === 0 ? (
                <div className="text-center py-20 bg-gray-800 rounded-2xl shadow-xl animate-fade-in">
                  <FaFeather className="mx-auto w-20 h-20 text-gray-500 mb-6" />
                  <h3 className="text-2xl font-semibold text-gray-200 mb-2">Nothing to see here yet</h3>
                  <p className="text-gray-400 mb-6">Be the first to share something with the community!</p>
                  <button
                    onClick={() => document.querySelector('textarea[placeholder="What\'s on your mind?"]')?.focus()}
                    className="text-indigo-400 hover:text-indigo-300 font-bold text-lg transition-colors"
                  >
                    Create the first post &rarr;
                  </button>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onNavigate={onNavigate}
                    onPostUpdate={fetchPosts}
                  />
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-10 space-y-8">
              <SearchUsers onNavigate={onNavigate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;