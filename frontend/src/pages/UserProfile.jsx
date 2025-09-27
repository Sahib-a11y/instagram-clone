import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TimeAgo from '../components/common/TimeAgo';
import FollowersModal from '../components/common/FollowersModal';
import { FaUserFriends, FaGlobe, FaLock, FaUserPlus, FaUserMinus, FaEnvelope, FaImage, FaHeart, FaComment, FaCalendarAlt, FaCheckCircle, FaPaperPlane, FaBroadcastTower } from 'react-icons/fa';

const UserProfile = ({ userId, onNavigate }) => {
  const { user: currentUser, token } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState(null);
  const [canViewPosts, setCanViewPosts] = useState(true);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [modalType, setModalType] = useState('');

  const fetchUserProfile = async () => {
    if (!userId) {
      setError('User ID not provided');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.result);
        setPosts(data.posts || []);
        setCanViewPosts(data.canViewPosts !== false);
        setIsFollowing(data.isFollowing || false);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.msg || 'Failed to fetch user profile');
      }
    } catch (error) {
      // console.error('Error fetching user profile:', error);
      setError('Network error occurred');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserProfile();
  }, [userId, currentUser, token]);

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

        
        setUserProfile(prev => ({
          ...prev,
          followers: isFollowing
            ? prev.followers.filter(id => id !== currentUser._id)
            : [...(prev.followers || []), currentUser._id]
        }));
      } else {
        const errorData = await response.json();
        alert(errorData.msg || 'Failed to update follow status');
      }
    } catch (error) {
      // console.error('Follow error:', error);
      alert('Failed to update follow status');
    }
    setFollowLoading(false);
  };

  const openFollowersModal = (type) => {
    setModalType(type);
    setShowFollowersModal(true);
  };

  const isVerified = userProfile?.isVerified || false;
  const isPrivate = userProfile?.isPrivate || false;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 text-gray-800">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4 bg-gray-50 text-gray-800">
        <div className="text-center py-12 px-8 bg-white rounded-3xl shadow-lg border border-gray-200">
          <FaUserMinus className="mx-auto w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            User Not Found
          </h3>
          <p className="text-gray-600 mb-6">
            The user you're looking for doesn't exist.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="bg-lime-500 hover:bg-lime-600 text-white px-6 py-3 rounded-full font-bold transition-all transform hover:scale-105"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === userId;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8 transform transition-all duration-300 hover:scale-[1.01]">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-10 md:space-y-0 md:space-x-12">
          
          <div className="flex-shrink-0 relative">
            <div className="w-40 h-40 rounded-full p-2 bg-gradient-to-tr from-lime-200 to-pink-200 shadow-lg">
              <img
                src={userProfile.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-4 border-white"
              />
            </div>
            {isOwnProfile && (
              <button className="absolute bottom-2 right-2 bg-white text-gray-600 rounded-full p-3 border border-gray-300 shadow-md hover:text-lime-500 hover:border-lime-500 transition-all transform hover:scale-110 active:scale-95">
                <FaImage className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left pt-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <div className="flex items-center justify-center md:justify-start space-x-2 mb-1">
                  <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
                    {userProfile.name}
                  </h1>
                  {isVerified && <FaCheckCircle className="w-6 h-6 text-lime-500" title="Verified" />}
                  {isPrivate && <FaLock className="w-5 h-5 text-gray-400" title="Private Account" />}
                </div>
                <p className="text-gray-500 text-lg mb-4">{userProfile.email}</p>
              </div>

              {!isOwnProfile && (
                <div className="flex justify-center md:justify-start space-x-4 mt-4 md:mt-0">
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-sm border ${
                      isFollowing
                        ? 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        : 'bg-lime-500 border-lime-500 text-white hover:bg-lime-600'
                    }`}
                  >
                    {followLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        {isFollowing ? <FaUserMinus className="w-5 h-5" /> : <FaUserPlus className="w-5 h-5" />}
                        <span>{isFollowing ? 'Unfollow' : 'Follow'}</span>
                      </>
                    )}
                  </button>

                  <button className="px-6 py-3 bg-white text-gray-600 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 flex items-center space-x-2 shadow-sm border border-gray-300 hover:bg-gray-50">
                    <FaEnvelope className="w-5 h-5" />
                    <span>Message</span>
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 text-center border-t border-gray-200 pt-6 mt-6">
              <div className="group cursor-pointer transition-transform duration-200 hover:scale-105" onClick={() => onNavigate('profile', { userId })}>
                <div className="text-4xl font-bold text-gray-900 transition-colors group-hover:text-lime-500">{posts.length}</div>
                <div className="text-sm text-gray-500">Posts</div>
              </div>
              <div
                className="group cursor-pointer transition-transform duration-200 hover:scale-105"
                onClick={() => canViewPosts && openFollowersModal('followers')}
              >
                <div className="text-4xl font-bold text-gray-900 transition-colors group-hover:text-lime-500">
                  {userProfile.followers?.length || 0}
                </div>
                <div className="text-sm text-gray-500">Followers</div>
              </div>
              <div
                className="group cursor-pointer transition-transform duration-200 hover:scale-105"
                onClick={() => canViewPosts && openFollowersModal('following')}
              >
                <div className="text-4xl font-bold text-gray-900 transition-colors group-hover:text-lime-500">
                  {userProfile.following?.length || 0}
                </div>
                <div className="text-sm text-gray-500">Following</div>
              </div>
            </div>

            
            <div className="bg-gray-50 rounded-lg p-5 mt-8 border border-gray-200">
              <p className="text-gray-600 text-sm mb-3">
                {isOwnProfile ? "This is your profile page." : `Welcome to ${userProfile.name}'s profile!`}
              </p>
              <div className="flex items-center justify-between text-gray-500 text-xs">
                <div className="flex items-center space-x-1">
                  <FaCalendarAlt className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Joined <TimeAgo date={userProfile.createdAt} /></span>
                </div>
                {!isOwnProfile && (
                  <button className="text-pink-500 hover:text-pink-600 font-medium flex items-center space-x-1 transition-colors">
                    <FaUserFriends className="w-4 h-4" />
                    <span>Mutual Connections</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl">
        <div className="border-b border-gray-200 px-8 py-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {isOwnProfile ? 'My Posts' : `${userProfile.name}'s Posts`}
          </h2>
          {posts.length > 0 && canViewPosts && (
            <span className="text-sm text-gray-500">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </span>
          )}
        </div>

        {!canViewPosts ? (
          <div className="text-center py-20 px-8">
            <FaLock className="mx-auto w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">This Account is Private</h3>
            <p className="text-gray-600 mb-6">
              Follow {userProfile.name} to see their posts and stories.
            </p>
            {!isFollowing && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className="bg-lime-500 hover:bg-lime-600 text-white px-6 py-3 rounded-full font-bold transition-all transform hover:scale-105 disabled:opacity-50"
              >
                {followLoading ? <LoadingSpinner size="sm" /> : 'Follow'}
              </button>
            )}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 px-8">
            <FaGlobe className="mx-auto w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-4">
              {isOwnProfile
                ? 'Share your first moment with the community!'
                : `${userProfile.name} hasn't shared anything yet.`}
            </p>
            {isOwnProfile && (
              <button
                onClick={() => onNavigate('home')}
                className="bg-lime-500 hover:bg-lime-600 text-white px-6 py-3 rounded-full font-bold transition-all transform hover:scale-105"
              >
                <FaPaperPlane className="inline-block mr-2" /> Create your first post
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {posts.map((post) => (
              <div key={post._id} className="group relative bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:scale-[1.01]">
                <div className="aspect-square bg-gray-100">
                  {post.photo ? (
                    <img
                      src={post.photo}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-4">
                      <FaImage className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm text-center font-medium line-clamp-2">{post.title}</p>
                    </div>
                  )}
                </div>

                {/* Post Info Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end">
                  <div className="text-white p-4">
                    <h3 className="font-bold mb-1 text-lg truncate">{post.title}</h3>
                    <div className="flex items-center justify-between text-xs text-gray-300 mt-2">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <FaHeart className="w-4 h-4 mr-1 text-red-400" />
                          {post.like?.length || 0}
                        </span>
                        <span className="flex items-center">
                          <FaComment className="w-4 h-4 mr-1 text-pink-400" />
                          {post.Comment?.length || 0}
                        </span>
                      </div>
                      <span className="text-sm"><TimeAgo date={post.createdAt} /></span>
                    </div>
                  </div>
                </div>

                
                <div
                  className="absolute inset-0 cursor-pointer"
                  onClick={() => {
                    
                    console.log('Post clicked:', post._id);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center space-x-4 my-6">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center px-6 py-3 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors shadow-sm transform hover:scale-105 active:scale-95"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>

          {!isOwnProfile && (
            <button
              onClick={() => onNavigate('profile')}
              className="inline-flex items-center px-6 py-3 text-sm font-bold text-white bg-lime-500 border border-transparent rounded-full hover:bg-lime-600 transition-colors shadow-sm transform hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </button>
          )}
        </div>

        {!isOwnProfile && currentUser?.following && userProfile.followers && (
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Connection Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-5 flex items-center space-x-4 border border-gray-200">
                <FaUserFriends className="w-8 h-8 text-lime-500" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Following Status</h4>
                  <p className="text-sm text-gray-600">
                    {isFollowing
                      ? `You are following ${userProfile.name}`
                      : `You are not following ${userProfile.name}`}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 flex items-center space-x-4 border border-gray-200">
                <FaUserFriends className="w-8 h-8 text-pink-500" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Follower Status</h4>
                  <p className="text-sm text-gray-600">
                    {userProfile.following?.includes(currentUser._id)
                      ? `${userProfile.name} is following you`
                      : `${userProfile.name} is not following you`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Followers Modal */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={userId}
        type={modalType}
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default UserProfile;