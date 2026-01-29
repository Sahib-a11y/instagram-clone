import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TimeAgo from '../components/common/TimeAgo';
import FollowersModal from '../components/common/FollowersModal';

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
  const [modalType, setModalType] = useState(''); // 'followers' or 'following'

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
    }
  }, [fetchMyPosts]);

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
      console.log()
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

  const handleEditPost = (postId) => {
    
    console.log('Edit post:', postId);
    
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          
          <div className="flex-shrink-0 relative">
            <img
              src={user?.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-md"
            />
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>

          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="text-2xl font-bold text-gray-900 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your name"
                    />
                    <p className="text-gray-600">{user?.email}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {user?.name}
                      </h1>
                      {user?.isPrivate && (
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4">{user?.email}</p>
                  </>
                )}
              </div>
              
              <div className="flex flex-col space-y-3">
                {isEditing ? (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveEdit}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
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
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-md font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-md font-medium transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={handlePrivacyToggle}
                      className={`px-6 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${
                        user?.isPrivate 
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d={user?.isPrivate 
                            ? "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            : "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          } 
                        />
                      </svg>
                      <span>{user?.isPrivate ? 'Make Public' : 'Make Private'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            
            <div className="flex justify-center md:justify-start space-x-8 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.postsCount}</div>
                <div className="text-sm text-gray-600">Posts</div>
              </div>
              <div 
                className="text-center cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-md transition-colors"
                onClick={() => openFollowersModal('followers')}
              >
                <div className="text-2xl font-bold text-gray-900">{stats.followersCount}</div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
              <div 
                className="text-center cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-md transition-colors"
                onClick={() => openFollowersModal('following')}
              >
                <div className="text-2xl font-bold text-gray-900">{stats.followingCount}</div>
                <div className="text-sm text-gray-600">Following</div>
              </div>
            </div>

            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 text-sm mb-3">
                Welcome to my profile! I love sharing moments and connecting with friends.
              </p>
              <div className="flex items-center justify-between text-gray-500 text-xs">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0V7a2 2 0 012-2h4a2 2 0 012 2v0m-6 0V7" />
                  </svg>
                  Joined <TimeAgo date={user?.createdAt} />
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user?.isPrivate 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user?.isPrivate ? 'Private Account' : 'Public Account'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">My Posts</h2>
          <button
            onClick={() => onNavigate('home')}
            className="text-blue-600 hover:text-blue-500 text-sm font-medium flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create New Post</span>
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500 mb-6">Share your first moment with the community!</p>
            <button
              onClick={() => onNavigate('home')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              Create your first post
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {posts.map((post) => (
              <div key={post._id} className="group relative bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200">
                <div className="aspect-square bg-gray-100">
                  {post.photo ? (
                    <img
                      src={post.photo}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end">
                  <div className="text-white p-4 w-full">
                    <h3 className="font-semibold mb-1 truncate">{post.title}</h3>
                    <p className="text-sm text-gray-200 mb-2 line-clamp-2">
                      {post.body}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-300">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          {post.like?.length || 0}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                          </svg>
                          {post.Comment?.length || 0}
                        </span>
                      </div>
                      <span><TimeAgo date={post.createdAt} /></span>
                    </div>
                  </div>
                </div>

                
                <button
                  onClick={() => handleDeletePost(post._id)}
                  className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                  title="Delete post"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>

                
                <button
                  onClick={() => handleEditPost(post._id)}
                  className="absolute top-3 right-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                  title="Edit post"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={user?._id}
        type={modalType}
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default Profile;