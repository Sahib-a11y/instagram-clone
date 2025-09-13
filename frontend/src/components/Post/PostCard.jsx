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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, pic: data.url }));
      } else {
        alert('Image upload failed');
      }
    } catch (error) {
      alert('Image upload failed');
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.body || !formData.pic) {
      alert('Please fill all fields and upload an image');
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
        setIsExpanded(false);
        onPostCreated();
      } else {
        alert('Failed to create post');
      }
    } catch (error) {
      alert('Failed to create post');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-start space-x-4">
        <div className="flex-1">
          {!isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <textarea
                placeholder="What's on your mind?"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploading && <p className="text-sm text-blue-600">Uploading image...</p>}
                {formData.pic && (
                  <img src={formData.pic} alt="Preview" className="w-32 h-32 object-cover rounded-md" />
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsExpanded(false);
                    setFormData({ title: '', body: '', pic: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || uploading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? <LoadingSpinner size="sm" /> : 'Post'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PostCard = ({ post, onNavigate }) => {
  const { user, token } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

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
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/comment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          postId: post._id,
          text: newComment
        })
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.result.Comment);
        setNewComment('');
      }
    } catch (error) {
      console.error('Comment error:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-6">
      {/* Post Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <img
            src={post.postedBy?.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover cursor-pointer"
            onClick={() => onNavigate('userProfile', post.postedBy?._id)}
          />
          <div>
            <h4 
              className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
              onClick={() => onNavigate('userProfile', post.postedBy?._id)}
            >
              {post.postedBy?.name}
            </h4>
            <p className="text-sm text-gray-500">
              {formatDate(post.createdAt || Date.now())}
            </p>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
        <p className="text-gray-700 mb-4">{post.body}</p>
        {post.photo && (
          <img
            src={post.photo}
            alt="Post"
            className="w-full max-h-96 object-cover rounded-md"
          />
        )}
      </div>

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 ${liked ? 'text-red-600' : 'text-gray-600'} hover:text-red-600 transition-colors`}
            >
              <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200">
          {/* Add Comment */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex space-x-3">
              <img
                src={user?.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
                alt="Your profile"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1 flex space-x-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Post
                </button>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="max-h-64 overflow-y-auto">
            {comments.map((comment, index) => (
              <div key={index} className="p-4 border-b border-gray-100 last:border-b-0">
                <div className="flex space-x-3">
                  <img
                    src={comment.postedBy?.pic || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s'}
                    alt="Commenter"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div>
                    <span className="font-medium text-sm text-gray-900">
                      {comment.postedBy?.name || 'Anonymous'}
                    </span>
                    <p className="text-sm text-gray-700 mt-1">{comment.text}</p>
                  </div>
                </div>
              </div>
            ))}
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

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/allpost`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <CreatePost onPostCreated={fetchPosts} />
      
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No posts yet. Create the first post!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard 
              key={post._id} 
              post={post} 
              onNavigate={onNavigate}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Home;