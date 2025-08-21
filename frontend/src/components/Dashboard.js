import React, { useState, useEffect } from 'react';
import Feed from './feed';
import CreatePost from './CreatePost';
import Profile from './profile';

const Dashboard = ({ userData, token }) => {
  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('http://localhost:5000/allpost', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts);
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
    };

    if (token) {
      fetchPosts();
    }
  }, [token]);

  const handleCreatePost = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex mb-6 border-b">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'feed' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('feed')}
        >
          Feed
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'create' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('create')}
        >
          Create Post
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'profile' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
      </div>

      {activeTab === 'feed' && <Feed posts={posts} token={token} />}
      {activeTab === 'create' && <CreatePost token={token} onCreatePost={handleCreatePost} />}
      {activeTab === 'profile' && <Profile userData={userData} token={token} />}
    </div>
  );
};

export default Dashboard;