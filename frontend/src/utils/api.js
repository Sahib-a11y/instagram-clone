const getApiUrl = (endpoint) => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const endpoints = {
    login: '/auth/login',
    register: '/auth/signup',
    signup: '/auth/signup',
    profile: '/auth/profile',
    updateProfile: '/auth/updateProfile',
    createPost: '/createPost',
    allpost: '/allpost',
    feed: '/feed',
    like: '/like',
    unlike: '/unlike',
    comment: '/comment',
    deletePost: '/deletepost',
    mypost: '/mypost',
    userProfile: '/user/profile',
    follow: '/user/follow',
    unfollow: '/user/unfollow',
    uploadProfilePic: '/upload/upload-profile-pic',
    uploadStory: '/upload/upload-story',
    story: {
      upload: '/story/upload',
      my: '/story/my',
      highlights: '/story/highlights',
      feed: '/story/feed',
      delete: '/story',
    },
    searchUsers: '/user/search',
    chat: '/chat',
    message: '/message',
    conversation: '/conversation',
    notifications: '/notification',
    'notifications/unread-count': '/notification/unread-count',
    'notifications/mark-all-read': '/notification/mark-all-read',
  };

  // Handle nested story endpoints
  if (endpoint.startsWith('story/')) {
    const storyEndpoint = endpoint.split('/')[1];
    return baseUrl + endpoints.story[storyEndpoint];
  }

  return baseUrl + (endpoints[endpoint] || endpoint);
};

export default getApiUrl;
