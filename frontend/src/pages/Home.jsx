  import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PostCard from '../components/Post/PostCard';
import getApiUrl from '../utils/api';
import { useSocket } from '../hooks/useSocket';
import useCreatePost from '../hooks/useCreatePost';
import {
  FaImage,
  FaTimes,
  FaHeart,
  FaComment,
  FaMoon,
  FaHome,
  FaSearch,
  FaPlus,
  FaVideo,
  FaUser,
  FaBell,
} from 'react-icons/fa';



const CreatePost = ({ onPostCreated }) => {
  const {
    isExpanded,
    setIsExpanded,
    formData,
    setFormData,
    selectedFile,
    previewImage,
    loading,
    handleImageSelect,
    handleSubmit,
    removeImage,
    resetForm,
    user
  } = useCreatePost(onPostCreated);

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
                    onClick={() => resetForm()}
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
  const { token, user } = useAuth();
  const { on: socketOn } = useSocket();
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // const [notifications, setNotifications] = useState([]);
  // const [unreadNotifications, setUnreadNotifications] = useState(0);

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

  const fetchStories = useCallback(async () => {
    try {
      const response = await fetch(getApiUrl('story/feed'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStories(data || []);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  }, [token]);

  // Prepare story items for display
  const userStory = stories.find(story => story.user._id === user._id);
  const otherStories = stories.filter(story => story.user._id !== user._id);
  const storyItems = [];
  if (userStory) {
    storyItems.push(userStory);
  }
  storyItems.push({ type: 'add' });
  otherStories.slice(0, 3).forEach(story => storyItems.push(story));

  useEffect(() => {
    fetchPosts();
    fetchStories();
  }, [fetchPosts, fetchStories]);

  // Listen for story notifications
  useEffect(() => {
    const cleanup = socketOn('new_story_notification', (data) => {
      console.log('New story notification:', data);
      // setNotifications(prev => [...prev, {
      //   id: Date.now(),
      //   ...data,
      //   timestamp: new Date()
      // }]);
      // setUnreadNotifications(prev => prev + 1);

      // Auto-hide notification after 5 seconds
      // setTimeout(() => {
      //   setNotifications(prev => prev.filter(n => n.id !== data.id));
      //   setUnreadNotifications(prev => Math.max(0, prev - 1));
      // }, 5000);
    });

    return cleanup;
  }, [socketOn]);

  const handleRefresh = () => {
    fetchPosts(true);
    fetchStories();
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
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
        <LoadingSpinner size="lg" color="#5A4FCF" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900 relative" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Header - Fixed at top */}
      <div className="sticky top-0 z-20 py-4 px-4 border-b border-gray-200" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold" style={{ color: '#5A4FCF', fontFamily: 'sans-serif' }}>SocialPulse</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <FaHeart className="w-6 h-6 text-gray-600" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</span>
            </div>
            <div className="relative cursor-pointer" onClick={() => onNavigate('chat')}>
              <FaComment className="w-6 h-6 text-gray-600 hover:text-blue-600 transition-colors" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stories Bar */}
      <div className="py-4 px-4 border-b border-gray-200" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {/* User's Story or Add Button */}
            {userStory ? (
              <div className="flex flex-col items-center space-y-1">
                <div
                  className="relative w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ borderColor: '#5A4FCF' }}
                  onClick={() => onNavigate('createStory')}
                >
                  <img src={userStory.mediaUrl} alt="Your Story" className="w-full h-full rounded-full object-cover" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                    <FaPlus className="w-3 h-3 text-white" />
                  </div>
                </div>
                <span className="text-xs text-gray-600">Your story</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-1">
                <div
                  className="relative w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300 cursor-pointer hover:bg-gray-300 transition-colors"
                  onClick={() => onNavigate('createStory')}
                >
                  <FaPlus className="w-6 h-6 text-gray-600" />
                </div>
                <span className="text-xs text-gray-600">Add</span>
              </div>
            )}

            {/* Other Users' Stories */}
            {otherStories.slice(0, 3).map((story) => (
              <div key={story._id} className="flex flex-col items-center space-y-1">
                <div
                  className="relative w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ borderColor: '#5A4FCF' }}
                  onClick={() => onNavigate('storyViewer', { stories: [story], currentIndex: 0 })}
                >
                  <img src={story.mediaUrl} alt="Story" className="w-full h-full rounded-full object-cover" />
                </div>
                <span className="text-xs text-gray-600">{story.user?.name || 'User'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>



      {/* Main Content - Scrollable */}
      <div className="px-4 py-6 pb-20">
        <div className="max-w-2xl mx-auto">
          <CreatePost onPostCreated={() => fetchPosts()} />

          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: '#E2E8F0' }}>
                <FaImage className="mx-auto w-12 h-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Nothing to see here yet</h3>
                <p className="text-gray-500 text-sm">Be the first to share something!</p>
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

      {/* Floating Action Button */}
      <button
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
        style={{ backgroundColor: '#5A4FCF' }}
        onClick={() => console.log('Dark mode toggle placeholder')}
        aria-label="Toggle dark mode"
        type="button"
      >
        <FaMoon className="w-6 h-6 text-white" />
      </button>

      {/* Bottom Navigation Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4"
        role="navigation"
        aria-label="Bottom navigation"
      >
        <div className="max-w-2xl mx-auto flex justify-around items-center">
          <button
            className="flex flex-col items-center space-y-1 p-2 rounded-lg"
            style={{ color: '#5A4FCF' }}
            onClick={() => onNavigate('home')}
            aria-current="page"
            aria-label="Home"
          >
            <FaHome className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </button>
          <button
            className="flex flex-col items-center space-y-1 p-2 rounded-lg text-gray-600"
            onClick={() => onNavigate('search')}
            aria-label="Search"
          >
            <FaSearch className="w-6 h-6" />
            <span className="text-xs">Search</span>
          </button>
          <button
            className="flex flex-col items-center space-y-1 p-2 rounded-lg text-gray-600"
            onClick={() => onNavigate('create')}
            aria-label="Create"
          >
            <FaPlus className="w-6 h-6" />
            <span className="text-xs">Create</span>
          </button>
          <button
            className="flex flex-col items-center space-y-1 p-2 rounded-lg text-gray-600"
            onClick={() => onNavigate('reels')}
            aria-label="Reels"
          >
            <FaVideo className="w-6 h-6" />
            <span className="text-xs">Reels</span>
          </button>
          <button
            className="flex flex-col items-center space-y-1 p-2 rounded-lg text-gray-600"
            onClick={() => onNavigate('profile')}
            aria-label="Profile"
          >
            <FaUser className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;