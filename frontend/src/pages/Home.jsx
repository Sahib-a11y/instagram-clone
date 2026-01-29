import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PostCard from '../components/Post/PostCard';
import {
  FaImage,
  FaTimes,
  FaSyncAlt,
  FaFeather,
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShareAlt,
  FaPaperPlane,
  FaEllipsisH,
} from 'react-icons/fa';
import TimeAgo from '../components/common/TimeAgo';
import { IconButton } from '@mui/material';



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



const Home = ({ onNavigate, onToggleFooter }) => {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = useCallback(async (showRefreshLoader = false) => {
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
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
    setLoading(false);
    if (showRefreshLoader) setRefreshing(false);
  }, [token]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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