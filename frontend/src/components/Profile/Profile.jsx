import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Profile = ({ onNavigate }) => {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    postsCount: 0,
    followersCount: 0,
    followingCount: 0
  });

  const fetchMyPosts = async () => {
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
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      setStats({
        postsCount: posts.length,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0
      });
    }
    fetchMyPosts();
  }, [user]);

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
        alert('Failed to delete post');
      }
    } catch (error) {
      alert('Failed to delete post');
    }
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            <img
              src={user?.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
            />
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {user?.name}
            </h1>
            <p className="text-gray-600 mb-4">{user?.email}</p>
            
            {/* Stats */}
            <div className="flex justify-center md:justify-start space-x-8 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{stats.postsCount}</div>
                <div className="text-sm text-gray-600">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{stats.followersCount}</div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{stats.followingCount}</div>
                <div className="text-sm text-gray-600">Following</div>
              </div>
            </div>

            {/* Edit Profile Button */}
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-md transition-colors">
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">My Posts</h2>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No posts yet</p>
            <button
              onClick={() => onNavigate('home')}
              className="mt-2 text-blue-600 hover:text-blue-500"
            >
              Create your first post
            </button>
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
                    <h3 className="font-semibold mb-1">{post.title}</h3>
                    <p className="text-sm mb-2">
                      {post.like?.length || 0} likes • {post.Comment?.length || 0} comments
                    </p>
                    <p className="text-xs">{formatDate(post.createdAt)}</p>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeletePost(post._id)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;