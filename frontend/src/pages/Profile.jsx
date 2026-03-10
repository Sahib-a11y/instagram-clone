import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FollowersModal from '../components/common/FollowersModal';
import CreatePostModal from '../components/Post/CreatePostModal';
import {
  FaTh,
  FaVideo,
  FaUserTag,
  FaPlus,
  FaChevronDown,
  FaLock,
  FaBars,
  FaHeart,
  FaComment
} from 'react-icons/fa';

const Profile = ({ onNavigate }) => {
  const { user, token, updateUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    postsCount: 0,
    followersCount: 0,
    followingCount: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [uploading, setUploading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [activeTab, setActiveTab] = useState('grid'); // 'grid', 'reels', 'tagged'
  const [highlights, setHighlights] = useState([]);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  const fetchMyPosts = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/mypost`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.post || []);
        setStats(prev => ({
          ...prev,
          postsCount: data.post?.length || 0
        }));
      } else {
        const errorData = await response.json();
        console.error('Fetch posts error:', errorData);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
    setLoading(false);
  }, [token]);

  const fetchHighlights = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/story/highlights`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHighlights(data || []);
      } else {
        console.error('Fetch highlights error:', await response.json());
      }
    } catch (error) {
      console.error('Error fetching highlights:', error);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      setStats(prev => ({
        ...prev,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0
      }));
      setEditForm({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      fetchMyPosts();
      fetchHighlights();
    }
  }, [fetchMyPosts, fetchHighlights, token]);

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/deletepost/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setPosts(posts.filter(post => post._id !== postId));
        setStats(prev => ({
          ...prev,
          postsCount: prev.postsCount - 1
        }));
      } else {
        const errorData = await response.json();
        alert(errorData.msg || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete post');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/upload-profile-pic`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        updateUser(data.user);
        alert('Profile picture updated successfully!');
      } else {
        alert(data.error || 'Profile picture upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Profile picture upload failed');
    }
    setUploading(false);
  };

  const updateProfile = async (updateData) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/updateProfile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const data = await response.json();
        updateUser(data.user);
        return true;
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update profile');
        return false;
      }
    } catch (error) {
      console.error('Update profile error:', error);
      alert('Failed to update profile');
      return false;
    }
  };

  const handlePrivacyToggle = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/privacy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPrivate: !user.isPrivate })
      });

      const data = await response.json();

      if (response.ok) {
        updateUser(data.user);
      } else {
        alert(data.error || 'Failed to update privacy settings');
      }
    } catch (error) {
      console.error('Privacy toggle error:', error);
      alert('Failed to update privacy settings');
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      alert('Name is required');
      return;
    }

    const success = await updateProfile({
      name: editForm.name.trim()
    });

    if (success) {
      setIsEditing(false);
    }
  };

  const openFollowersModal = (type) => {
    setModalType(type);
    setShowFollowersModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaLock className="w-4 h-4 text-gray-400" />
            <button className="flex items-center space-x-1 text-white font-semibold">
              <span>{user?.name || 'User'}</span>
              <FaChevronDown className="w-3 h-3 text-gray-400" />
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button className="w-8 h-8 bg-gray-700 rounded-md flex items-center justify-center hover:bg-gray-600">
              <FaPlus className="w-5 h-5 text-white" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded-md">
              <FaBars className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Profile Info */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-600">
                {user?.pic ? (
                  <img
                    src={user.pic}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex space-x-6">
              <div className="text-center">
                <div className="text-lg font-semibold">{stats.postsCount}</div>
                <div className="text-xs text-gray-400">Posts</div>
              </div>
              <button 
                className="text-center hover:opacity-70"
                onClick={() => openFollowersModal('followers')}
              >
                <div className="text-lg font-semibold">{stats.followersCount}</div>
                <div className="text-xs text-gray-400">Followers</div>
              </button>
              <button 
                className="text-center hover:opacity-70"
                onClick={() => openFollowersModal('following')}
              >
                <div className="text-lg font-semibold">{stats.followingCount}</div>
                <div className="text-xs text-gray-400">Following</div>
              </button>
            </div>
          </div>

          {/* Username & Bio */}
          {isEditing ? (
            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-gray-600"
                placeholder="Your name"
              />
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
          ) : (
            <>
              <div className="mb-1">
                <h2 className="font-semibold text-sm">{user?.name}</h2>
              </div>
              <div className="mb-3">
                <p className="text-xs text-gray-400">
                  Welcome to my profile! I love sharing moments and connecting with friends.
                </p>
              </div>
              {user?.isPrivate && (
                <div className="flex items-center space-x-1 mb-3">
                  <FaLock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">Private Account</span>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          {isEditing ? (
            <div className="flex space-x-2">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm font-semibold"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditForm({
                    name: user?.name || '',
                    email: user?.email || ''
                  });
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm font-semibold"
              >
                Edit Profile
              </button>
              <button
                onClick={handlePrivacyToggle}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md text-sm font-semibold"
              >
                {user?.isPrivate ? 'Make Public' : 'Make Private'}
              </button>
              <label className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-md flex items-center justify-center cursor-pointer">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          )}
        </div>

        {/* Highlights */}
        <div className="mb-6 pb-4 border-b border-gray-800">
          <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
            {/* Add Highlight */}
            <div className="flex flex-col items-center flex-shrink-0">
              <button
                onClick={() => onNavigate('createStory')}
                className="w-16 h-16 rounded-full border-2 border-gray-700 flex items-center justify-center hover:border-gray-600"
              >
                <FaPlus className="w-6 h-6 text-gray-400" />
              </button>
              <span className="text-xs text-gray-400 mt-1">New</span>
            </div>
            {/* Highlights */}
            {highlights.map((highlight) => (
              <div key={highlight._id} className="flex flex-col items-center flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-indigo-500">
                  {highlight.type === 'image' ? (
                    <img
                      src={highlight.mediaUrl}
                      alt="Highlight"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={highlight.mediaUrl}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <span className="text-xs text-gray-400 mt-1">Highlight</span>
              </div>
            ))}
            {/* Placeholder if no highlights */}
            {highlights.length === 0 && (
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs text-gray-400 mt-1">No highlights</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 mb-4">
          <button
            onClick={() => setActiveTab('grid')}
            className={`flex-1 py-3 flex items-center justify-center ${
              activeTab === 'grid' 
                ? 'text-white border-b-2 border-white' 
                : 'text-gray-500'
            }`}
          >
            <FaTh className="w-6 h-6" />
          </button>
          <button
            onClick={() => setActiveTab('reels')}
            className={`flex-1 py-3 flex items-center justify-center ${
              activeTab === 'reels' 
                ? 'text-white border-b-2 border-white' 
                : 'text-gray-500'
            }`}
          >
            <FaVideo className="w-6 h-6" />
          </button>
          <button
            onClick={() => setActiveTab('tagged')}
            className={`flex-1 py-3 flex items-center justify-center ${
              activeTab === 'tagged' 
                ? 'text-white border-b-2 border-white' 
                : 'text-gray-500'
            }`}
          >
            <FaUserTag className="w-6 h-6" />
          </button>
        </div>

        {/* Posts Grid */}
        {activeTab === 'grid' && (
          <>
            {posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-700 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
                <p className="text-gray-400 text-sm mb-6">Share your first photo or video</p>
                <button
                  onClick={() => setShowCreatePostModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-semibold"
                >
                  Create Post
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {posts.map((post) => (
                  <div 
                    key={post._id} 
                    className="relative aspect-square bg-gray-800 group cursor-pointer"
                  >
                    {post.photo ? (
                      <img
                        src={post.photo}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <svg className="w-12 h-12 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex items-center space-x-6 text-white">
                        <div className="flex items-center space-x-2">
                          <FaHeart className="w-5 h-5" />
                          <span className="font-semibold">{post.like?.length || 0}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FaComment className="w-5 h-5" />
                          <span className="font-semibold">{post.Comment?.length || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePost(post._id);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'reels' && (
          <div className="text-center py-16">
            <FaVideo className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold mb-2">No Reels Yet</h3>
            <p className="text-gray-400 text-sm">Share your first reel</p>
          </div>
        )}

        {activeTab === 'tagged' && (
          <div className="text-center py-16">
            <FaUserTag className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold mb-2">No Tagged Posts</h3>
            <p className="text-gray-400 text-sm">You haven't been tagged in any posts yet</p>
          </div>
        )}
      </div>

      {/* Followers Modal */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={user?._id}
        type={modalType}
        onNavigate={onNavigate}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
        onPostCreated={() => {
          fetchMyPosts();
          setShowCreatePostModal(false);
        }}
      />

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Profile;