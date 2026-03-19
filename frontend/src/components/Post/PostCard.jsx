import { getBaseUrl } from '../../utils/api';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FaHeart, FaComment, FaShare, FaBookmark, FaEllipsisH } from 'react-icons/fa';

const PostCard = ({ post, onNavigate, onPostUpdate }) => {
  const { user, token } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [newReply, setNewReply] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [showReplies, setShowReplies] = useState({});
  const [commentLikes, setCommentLikes] = useState({});
  const [replyLikes, setReplyLikes] = useState({});
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (post.like) {
      setLiked(post.like.includes(user?._id));
      setLikeCount(post.like.length);
    }
    if (post.Comment) {
      setComments(post.Comment);
      // Initialize comment likes state
      const initialCommentLikes = {};
      const initialReplyLikes = {};
      post.Comment.forEach(comment => {
        initialCommentLikes[comment._id] = comment.like?.includes(user?._id) || false;
        if (comment.replies) {
          comment.replies.forEach(reply => {
            initialReplyLikes[reply._id] = reply.like?.includes(user?._id) || false;
          });
        }
      });
      setCommentLikes(initialCommentLikes);
      setReplyLikes(initialReplyLikes);
    }
  }, [post, user]);

  const handleLike = async () => {
    try {
      const endpoint = liked ? 'unlike' : 'like';
      const response = await fetch(`${getBaseUrl()}/${endpoint}`, {
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
      const response = await fetch(`${getBaseUrl()}/comment`, {
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
        const updatedComments = data.result.Comment || [];
        setComments(updatedComments);
        onPostUpdate(post._id, { Comment: updatedComments });
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

  const handleCommentLike = async (commentId) => {
    try {
      const isLiked = commentLikes[commentId];
      const endpoint = isLiked ? 'unlike' : 'like';
      const response = await fetch(`${getBaseUrl()}/comment/${endpoint}/${post._id}/${commentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const updatedComments = data.result.Comment || [];
        setComments(updatedComments);
        onPostUpdate(post._id, { Comment: updatedComments });
        setCommentLikes(prev => ({
          ...prev,
          [commentId]: !isLiked
        }));
      } else {
        const errorData = await response.json();
        console.error('Comment like error:', errorData);
      }
    } catch (error) {
      console.error('Comment like error:', error);
    }
  };

  const handleReplyLike = async (commentId, replyId) => {
    try {
      const isLiked = replyLikes[replyId];
      const endpoint = isLiked ? 'unlike' : 'like';
      const response = await fetch(`${getBaseUrl()}/comment/reply/${endpoint}/${post._id}/${commentId}/${replyId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const updatedComments = data.result.Comment || [];
        setComments(updatedComments);
        onPostUpdate(post._id, { Comment: updatedComments });
        setReplyLikes(prev => ({
          ...prev,
          [replyId]: !isLiked
        }));
      } else {
        const errorData = await response.json();
        console.error('Reply like error:', errorData);
      }
    } catch (error) {
      console.error('Reply like error:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`${getBaseUrl()}/comment/${post._id}/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const updatedComments = data.result.Comment || [];
        setComments(updatedComments);
        onPostUpdate(post._id, { Comment: updatedComments });
      } else {
        const errorData = await response.json();
        console.error('Delete comment error:', errorData);
        alert(errorData.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      alert('Failed to delete comment');
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;

    try {
      const response = await fetch(`${getBaseUrl()}/comment/reply/${post._id}/${commentId}/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const updatedComments = data.result.Comment || [];
        setComments(updatedComments);
        onPostUpdate(post._id, { Comment: updatedComments });
      } else {
        const errorData = await response.json();
        console.error('Delete reply error:', errorData);
        alert(errorData.error || 'Failed to delete reply');
      }
    } catch (error) {
      console.error('Delete reply error:', error);
      alert('Failed to delete reply');
    }
  };

  const handleReply = async (commentId) => {
    if (!newReply.trim()) return;

    setReplyLoading(true);
    try {
      const response = await fetch(`${getBaseUrl()}/comment/reply/${post._id}/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: newReply.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedComments = data.result.Comment || [];
        setComments(updatedComments);
        onPostUpdate(post._id, { Comment: updatedComments });
        setNewReply('');
        setReplyingTo(null);
      } else {
        const errorData = await response.json();
        console.error('Reply error:', errorData);
        alert('Failed to add reply');
      }
    } catch (error) {
      console.error('Reply error:', error);
      alert('Failed to add reply');
    }
    setReplyLoading(false);
  };

  const toggleReplies = (commentId) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
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

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
  };

  return (
    <div className="bg-white mb-4" style={{ borderRadius: '0px' }}>
      {/* Post Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer overflow-hidden"
            onClick={() => post.postedBy?._id && onNavigate('userProfile', post.postedBy._id)}
          >
            {post.postedBy?.pic ? (
              <img
                src={post.postedBy.pic}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div>
            <p 
              className="text-sm font-semibold text-gray-900 cursor-pointer hover:underline" 
              onClick={() => post.postedBy?._id && onNavigate('userProfile', post.postedBy._id)}
            >
              {post.postedBy?.name || 'Unknown'}
            </p>
          </div>
        </div>
        <button className="text-gray-600 hover:text-gray-800">
          <FaEllipsisH className="w-5 h-5" />
        </button>
      </div>

      {/* Post Image */}
      <div className="w-full bg-gray-100" style={{ minHeight: '400px', maxHeight: '600px' }}>
        {post.photo ? (
          <img
            src={post.photo}
            alt={post.title || 'post image'}
            className="w-full h-full object-cover"
            style={{ minHeight: '400px', maxHeight: '600px' }}
          />
        ) : (
          <div className="w-full flex items-center justify-center bg-gray-100" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <svg className="mx-auto w-20 h-20 text-gray-300 mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <p className="text-gray-400 text-sm">IMAGE PLACEHOLDER</p>
            </div>
          </div>
        )}
      </div>

      {/* Interaction Bar */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`transition-all ${liked ? 'text-red-500' : 'text-gray-900'}`}
              aria-label={liked ? 'Unlike' : 'Like'}
            >
              {liked ? (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="text-gray-900"
              aria-label="Comment"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>

            <button className="text-gray-900" aria-label="Share">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          <button 
            onClick={handleBookmark}
            className={`${bookmarked ? 'text-gray-900' : 'text-gray-900'}`}
            aria-label="Bookmark"
          >
            {bookmarked ? (
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            )}
          </button>
        </div>

        {/* Like Count */}
        {likeCount > 0 && (
          <p className="text-sm font-semibold text-gray-900 mb-2">
            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          </p>
        )}

        {/* Caption */}
        {(post.caption || post.body) && (
          <div className="text-sm mb-2">
            <span className="font-semibold text-gray-900 mr-2">
              {post.postedBy?.name || 'Unknown'}
            </span>
            <span className="text-gray-900">{post.caption || post.body}</span>
          </div>
        )}

        {/* View Comments */}
        {comments.length > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            View all {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </button>
        )}

        {/* Time */}
        <p className="text-xs text-gray-400 uppercase">
          {formatDate(post.createdAt || Date.now())}
        </p>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200">
          {/* Comments List */}
          <div className="max-h-96 overflow-y-auto">
            {comments.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-500">No comments yet</p>
                <p className="text-xs text-gray-400 mt-1">Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment, index) => (
                <div
                  key={comment._id || index}
                  className="px-4 py-3 hover:bg-gray-50"
                >
                  <div className="flex space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0"
                      onClick={() => comment.postedBy?._id && onNavigate('userProfile', comment.postedBy._id)}
                    >
                      {comment.postedBy?.pic ? (
                        <img
                          src={comment.postedBy.pic}
                          alt="Commenter"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <span
                          className="font-semibold text-gray-900 hover:underline cursor-pointer mr-2"
                          onClick={() => comment.postedBy?._id && onNavigate('userProfile', comment.postedBy._id)}
                        >
                          {comment.postedBy?.name || 'Anonymous'}
                        </span>
                        <span className="text-gray-900">{comment.text}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-400">
                          {formatDate(comment.createdAt || Date.now())}
                        </span>
                        <button
                          onClick={() => handleCommentLike(comment._id)}
                          className={`text-xs font-semibold ${
                            commentLikes[comment._id] ? 'text-red-500' : 'text-gray-500'
                          }`}
                        >
                          {commentLikes[comment._id] ? 'Liked' : 'Like'}
                        </button>
                        <button
                          onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                          className="text-xs font-semibold text-gray-500"
                        >
                          Reply
                        </button>
                        {comment.postedBy._id === user._id && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-xs font-semibold text-gray-500 hover:text-red-500"
                          >
                            Delete
                          </button>
                        )}
                        {comment.replies && comment.replies.length > 0 && (
                          <button
                            onClick={() => toggleReplies(comment._id)}
                            className="text-xs font-semibold text-gray-500"
                          >
                            {showReplies[comment._id] ? 'Hide' : 'View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                          </button>
                        )}
                      </div>

                      {/* Reply Input */}
                      {replyingTo === comment._id && (
                        <div className="mt-3 flex space-x-2">
                          <input
                            type="text"
                            placeholder="Add a reply..."
                            value={newReply}
                            onChange={(e) => setNewReply(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleReply(comment._id);
                              }
                            }}
                            disabled={replyLoading}
                            className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 disabled:opacity-50"
                            maxLength={200}
                          />
                          <button
                            onClick={() => handleReply(comment._id)}
                            disabled={!newReply.trim() || replyLoading}
                            className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {replyLoading ? <LoadingSpinner size="sm" /> : 'Post'}
                          </button>
                        </div>
                      )}

                      {/* Replies */}
                      {showReplies[comment._id] && comment.replies && comment.replies.map((reply, rIndex) => (
                        <div key={reply._id || rIndex} className="mt-3 ml-8 flex space-x-3">
                          <div 
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0"
                            onClick={() => reply.postedBy?._id && onNavigate('userProfile', reply.postedBy._id)}
                          >
                            {reply.postedBy?.pic ? (
                              <img
                                src={reply.postedBy.pic}
                                alt="Reply"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm">
                              <span
                                className="font-semibold text-gray-900 hover:underline cursor-pointer mr-2"
                                onClick={() => reply.postedBy?._id && onNavigate('userProfile', reply.postedBy._id)}
                              >
                                {reply.postedBy?.name || 'Anonymous'}
                              </span>
                              <span className="text-gray-900">{reply.text}</span>
                            </div>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-400">
                                {formatDate(reply.createdAt || Date.now())}
                              </span>
                              <button
                                onClick={() => handleReplyLike(comment._id, reply._id)}
                                className={`text-xs font-semibold ${
                                  replyLikes[reply._id] ? 'text-red-500' : 'text-gray-500'
                                }`}
                              >
                                {replyLikes[reply._id] ? 'Liked' : 'Like'}
                              </button>
                              {reply.postedBy._id === user._id && (
                                <button
                                  onClick={() => handleDeleteReply(comment._id, reply._id)}
                                  className="text-xs font-semibold text-gray-500 hover:text-red-500"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment */}
          <div className="border-t border-gray-200 px-4 py-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {user?.pic ? (
                  <img
                    src={user.pic}
                    alt="Your profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={commentLoading}
                className="flex-1 text-sm px-0 py-2 border-0 focus:outline-none focus:ring-0 disabled:opacity-50 placeholder-gray-400"
                maxLength={200}
              />
              {newComment.trim() && (
                <button
                  onClick={handleComment}
                  disabled={!newComment.trim() || commentLoading}
                  className="text-sm font-semibold text-blue-500 hover:text-blue-600 disabled:opacity-50"
                >
                  {commentLoading ? <LoadingSpinner size="sm" /> : 'Post'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;