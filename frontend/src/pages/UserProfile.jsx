import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CreatePost = ({ onPostCreated }) => {
  const { token } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    pic: ''
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewImage(e.target.result);
    reader.readAsDataURL(file);

    // Upload to server
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, pic: data.url }));
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Image upload failed');
        setPreviewImage(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Image upload failed');
      setPreviewImage(null);
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.body.trim()) {
      alert('Please fill in title and description');
      return;
    }

    if (!formData.pic) {
      alert('Please upload an image');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/createPost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setFormData({ title: '', body: '', pic: '' });
        setPreviewImage(null);
        setIsExpanded(false);
        onPostCreated();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Create post error:', error);
      alert('Failed to create post');
    }
    setLoading(false);
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, pic: '' }));
    setPreviewImage(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 transition-all duration-200">
      <div className="flex items-start space-x-4">
        <div className="flex-1">
          {!isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="text-gray-500">What's on your mind?</span>
            </button>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Post title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                maxLength={100}
              />
              
              <textarea
                placeholder="What's on your mind?"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                maxLength={500}
              />

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-md transition-colors">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-blue-600">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  
                  {uploading && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <LoadingSpinner size="sm" />
                      <span className="text-sm">Uploading...</span>
                    </div>
                  )}
                </div>

                {previewImage && (
                  <div className="relative inline-block">
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-md border border-gray-200" 
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {formData.title.length}/100 • {formData.body.length}/500
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setIsExpanded(false);
                      setFormData({ title: '', body: '', pic: '' });
                      setPreviewImage(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || uploading || !formData.title.trim() || !formData.body.trim() || !formData.pic}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
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
    if (post.like) {
      setLiked(post.like.includes(user?._id));
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ postId: post._id })
      });

      if (response.ok) {
        setLiked(!liked);
        setLikeCount(liked ? likeCount - 1 : likeCount + 1);
      } else {
        const errorData = await response.json();
        console.error('Like error:', errorData);
      }
    } catch (error) {
      console.error('Like error:', error);
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          postId: post._id,
          text: newComment.trim()
        })
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-6 hover:shadow-lg transition-shadow duration-200">
      {/* Post Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={post.postedBy?.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover cursor-pointer border-2 border-gray-200 hover:border-blue-400 transition-colors"
              onClick={() => post.postedBy?._id && onNavigate('userProfile', post.postedBy._id)}
            />
            <div>
              <h4 
                className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => post.postedBy?._id && onNavigate('userProfile', post.postedBy._id)}
              >
                {post.postedBy?.name || 'Unknown User'}
              </h4>
              <p className="text-sm text-gray-500">
                {formatDate(post.createdAt || Date.now())}
              </p>
            </div>
          </div>
          
          {/* More options menu could go here */}
          <div className="relative">
            <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
        <p className="text-gray-700 mb-4 leading-relaxed">{post.body}</p>
        {post.photo && (
          <div className="rounded-lg overflow-hidden bg-gray-100">
            <img
              src={post.photo}
              alt="Post content"
              className="w-full max-h-96 object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
              onClick={() => {
                // Could open image in modal
              }}
            />
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors ${
                liked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
              }`}
            >
              <svg 
                className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} 
                fill={liked ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                />
              </svg>
              <span className="font-medium">{likeCount}</span>
              <span className="hidden sm:inline">{likeCount === 1 ? 'Like' : 'Likes'}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="font-medium">{comments.length}</span>
              <span className="hidden sm:inline">{comments.length === 1 ? 'Comment' : 'Comments'}</span>
            </button>

            <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200 bg-gray-50">
          {/* Add Comment */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex space-x-3">
              <img
                src={user?.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
                alt="Your profile"
                className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
              />
              <div className="flex-1 flex space-x-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={commentLoading}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 transition-colors"
                  maxLength={200}
                />
                <button
                  onClick={handleComment}
                  disabled={!newComment.trim() || commentLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                >
                  {commentLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span className="hidden sm:inline">Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">
              {newComment.length}/200
            </div>
          </div>

          {/* Comments List */}
          <div className="max-h-64 overflow-y-auto">
            {comments.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment, index) => (
                <div key={index} className="p-4 border-b border-gray-200 last:border-b-0 bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex space-x-3">
                    <img
                      src={comment.postedBy?.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
                      alt="Commenter"
                      className="w-6 h-6 rounded-full object-cover border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm text-gray-900">
                          {comment.postedBy?.name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt || Date.now())}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1 break-words">
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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with refresh */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Home Feed</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {refreshing ? (
            <LoadingSpinner size="sm" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          <span>Refresh</span>
        </button>
      </div>

      <CreatePost onPostCreated={() => fetchPosts()} />
      
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <svg className="mx-auto w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500 mb-4">Be the first to share something with the community!</p>
            <button
              onClick={() => document.querySelector('input[placeholder="What\'s on your mind?"]')?.focus()}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Create the first post →
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
  );
};

export default Home;