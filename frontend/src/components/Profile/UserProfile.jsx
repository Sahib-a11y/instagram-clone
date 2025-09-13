import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const UserProfile = ({ userId, onNavigate }) => {
  const { user: currentUser, token } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchUserProfile = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.result);
        setPosts(data.posts || []);
        
        // Check if current user is following this user
        if (currentUser?.following) {
          setIsFollowing(currentUser.following.includes(userId));
        }
      } else {
        console.error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserProfile();
  }, [userId, currentUser]);

  const handleFollow = async () => {
    if (!userProfile) return;
    
    setFollowLoading(true);
    try {
      const endpoint = isFollowing ? '/unfollow' : '/follow';
      const bodyKey = isFollowing ? 'UnfollowId' : 'followId';
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          [bodyKey]: userId
        })
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        
        // Update follower count
        setUserProfile(prev => ({
          ...prev,
          followers: isFollowing 
            ? prev.followers.filter(id => id !== currentUser._id)
            : [...prev.followers, currentUser._id]
        }));
      } else {
        alert('Failed to update follow status');
      }
    } catch (error) {
      alert('Failed to update follow status');
    }
    setFollowLoading(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">User not found</p>
        <button
          onClick={() => onNavigate('home')}
          className="mt-4 text-blue-600 hover:text-blue-500"
        >
          Go back to home
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === userId;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            <img
              src={userProfile.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
            />
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 md:mb-0">
                {userProfile.name}
              </h1>
              
              {!isOwnProfile && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isFollowing
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {followLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : isFollowing ? (
                    'Unfollow'
                  ) : (
                    'Follow'
                  )}
                </button>
              )}
            </div>
            
            <p className="text-gray-600 mb-4">{userProfile.email}</p>
            
            {/* Stats */}
            <div className="flex justify-center md:justify-start space-x-8">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{posts.length}</div>
                <div className="text-sm text-gray-600">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">
                  {userProfile.followers?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">
                  {userProfile.following?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Following</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isOwnProfile ? 'My Posts' : `${userProfile.name}'s Posts`}
          </h2>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">
              {isOwnProfile ? 'No posts yet' : `${userProfile.name} hasn't posted anything yet`}
            </p>
            {isOwnProfile && (
              <button
                onClick={() => onNavigate('home')}
                className="mt-2 text-blue-600 hover:text-blue-500"
              >
                Create your first post
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {posts.map((post) => (
              <div key={post._id} className="group relative">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {post.photo ? (
                    <img
                      src={post.photo}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Post Info Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="text-white text-center">
                    <h3 className="font-semibold mb-1 px-2">{post.title}</h3>
                    <p className="text-sm mb-2">
                      {post.like?.length || 0} likes • {post.Comment?.length || 0} comments
                    </p>
                    <p className="text-xs">{formatDate(post.createdAt)}</p>
                  </div>
                </div>

                {/* Post Details on Click */}
                <div className="absolute inset-0 cursor-pointer" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="mt-6 text-center">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default UserProfile;