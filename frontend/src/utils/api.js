export const getBaseUrl = () =>
  (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const getApiUrl = (endpoint) => {
  const baseUrl = getBaseUrl();
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
    follow: '/follow',
    unfollow: '/unfollow',
    privacy: '/privacy',
    uploadProfilePic: '/upload/upload-profile-pic',
    uploadStory: '/upload/upload-story',
    notification: '/notification',
    'notifications/unread-count': '/notification/unread-count',
    'notifications/mark-all-read': '/notification/mark-all-read',
    story: {
      upload: '/story/upload',
      my: '/story/my',
      highlights: '/story/highlights',
      feed: '/story/feed',
      delete: '/story',
    },
    searchUsers: '/search',
    chat: '/chat',
    message: '/message',
    conversation: '/conversation',
    notifications: '/notification',
  };

  // Handle nested story endpoints
  if (endpoint.startsWith('story/')) {
    const storyEndpoint = endpoint.split('/')[1];
    return baseUrl + endpoints.story[storyEndpoint];
  }

  // Handle dynamic notification read endpoint
  if (endpoint.startsWith('notifications/') && endpoint.endsWith('/read')) {
    const id = endpoint.split('/')[1];
    return `${baseUrl}/notification/${id}/read`;
  }

  return baseUrl + (endpoints[endpoint] || ('/' + endpoint).replace('//', '/'));
};

export default getApiUrl;
