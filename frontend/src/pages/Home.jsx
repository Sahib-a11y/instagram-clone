import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TimeAgo from '../components/common/TimeAgo';
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
      alert('Failed to create post: ' + error.message);
    }
    setLoading(false);
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewImage(null);
  };

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-start space-x-4">
        {user?.pic && (
          <img
            src={user.pic}
            alt="User profile"
            className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500"
          />
        )}
        <div className="flex-1">
          {!isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full text-left px-4 py-3 border border-gray-700 rounded-full bg-gray-700 text-gray-400 hover:bg-gray-700/75 transition-all duration-300"
            >
              <span className="font-light">Share something...</span>
            </button>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Post title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={100}
              />

              <textarea
                placeholder="What's on your mind?"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                maxLength={500}
              />

              {previewImage && (
                <div className="relative inline-block w-48 h-48">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-xl border-2 border-gray-700"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                <label className="flex items-center space-x-2 cursor-pointer text-indigo-400 hover:text-indigo-300">
                  <FaImage className="w-5 h-5" />
                  <span className="text-sm">
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

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setIsExpanded(false);
                      setFormData({ title: '', body: '' });
                      setSelectedFile(null);
                      setPreviewImage(null);
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !formData.title.trim() || !formData.body.trim() || !selectedFile}
                    className="px-6 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center space-x-2"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : <span>Post</span>}
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
      alert('Network error occurred');
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}comment`, {
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
        alert('Failed to add comment');
      }
    } catch (error) {
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
    <div className="bg-gray-800 rounded-2xl shadow-lg mb-6">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={post.postedBy?.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover cursor-pointer border-2 border-indigo-500"
              onClick={() => post.postedBy?._id && onNavigate('userProfile', post.postedBy._id)}
            />
            <div>
              <h4
                className="font-semibold text-gray-200 cursor-pointer hover:text-indigo-400"
                onClick={() => post.postedBy?._id && onNavigate('userProfile', post.postedBy._id)}
              >
                {post.postedBy?.name || 'Unknown User'}
              </h4>
              <p className="text-sm text-gray-500">
                <TimeAgo date={post.createdAt || Date.now()} />
              </p>
            </div>
          </div>
          <IconButton className="text-gray-400 hover:text-white hover:bg-gray-700">
            <FaEllipsisH className="w-4 h-4" />
          </IconButton>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-100 mb-2">{post.title}</h3>
        <p className="text-gray-400 mb-3">{post.body}</p>
        {post.photo && (
          <div className="rounded-lg overflow-hidden bg-gray-900">
            <img
              src={post.photo}
              alt="Post content"
              className="w-full h-auto object-cover"
            />
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-700">
        <div className="flex items-center justify-between text-gray-500">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 ${liked ? 'text-red-500' : 'hover:text-red-400'}`}
          >
            {liked ? <FaHeart className="w-5 h-5" /> : <FaRegHeart className="w-5 h-5" />}
            <span>{likeCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 hover:text-indigo-400"
          >
            <FaComment className="w-5 h-5" />
            <span>{comments.length}</span>
          </button>

          <button className="flex items-center space-x-2 hover:text-emerald-400">
            <FaShareAlt className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showComments && (
        <div className="border-t border-gray-700 bg-gray-900/50">
          <div className="p-4 border-b border-gray-800 bg-gray-800">
            <div className="flex space-x-3 items-start">
              <img
                src={user?.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
                alt="Your profile"
                className="w-8 h-8 rounded-full object-cover border border-gray-700"
              />
              <div className="flex-1 flex space-x-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={commentLoading}
                  className="flex-1 px-3 py-2 border border-gray-700 rounded-full bg-gray-900 text-white placeholder-gray-500 text-sm"
                  maxLength={200}
                />
                <button
                  onClick={handleComment}
                  disabled={!newComment.trim() || commentLoading}
                  className="px-3 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 disabled:opacity-50 text-sm"
                >
                  {commentLoading ? <LoadingSpinner size="sm" /> : <FaPaperPlane className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {comments.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment, index) => (
                <div key={index} className="p-4 border-b border-gray-800 last:border-b-0">
                  <div className="flex space-x-2">
                    <img
                      src={comment.postedBy?.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
                      alt="Commenter"
                      className="w-6 h-6 rounded-full object-cover border border-gray-700"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm text-gray-300">
                          {comment.postedBy?.name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gray-500">
                          <TimeAgo date={comment.createdAt || Date.now()} />
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
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

const Home = ({ onNavigate, onToggleFooter }) => {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async (showRefreshLoader = false) => {
    if (showRefreshLoader) setRefreshing(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}allpost`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
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

  // Handle comment input focus to hide footer
  const handleCommentFocus = () => {
    if (onToggleFooter) {
      onToggleFooter(true);
    }
  };

  // Handle comment input blur to show footer
  const handleCommentBlur = () => {
    if (onToggleFooter) {
      onToggleFooter(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <LoadingSpinner size="lg" color="indigo" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header - Fixed at top */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 py-4 px-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-100">Home Feed</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 disabled:opacity-50 text-sm transition-all"
          >
            {refreshing ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <FaSyncAlt className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <CreatePost onPostCreated={() => fetchPosts()} />

          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-2xl">
                <FaFeather className="mx-auto w-12 h-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-200 mb-2">Nothing to see here yet</h3>
                <p className="text-gray-400 text-sm">Be the first to share something!</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onNavigate={onNavigate}
                  onPostUpdate={fetchPosts}
                  onCommentFocus={handleCommentFocus}
                  onCommentBlur={handleCommentBlur}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;