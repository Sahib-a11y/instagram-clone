import React, { useState, useEffect } from 'react';

const Profile = ({ userData, token }) => {
  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/user/${userData._id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfileData(data.result);
          setUserPosts(data.posts);
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      }
    };

    fetchProfileData();
  }, [userData._id, token]);

  if (!profileData) {
    return <div className="text-center">Loading profile...</div>;
  }

  return (
    <div>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center">
          <img 
            src={profileData.pic} 
            alt={profileData.name} 
            className="w-20 h-20 rounded-full mr-4"
          />
          <div>
            <h2 className="text-2xl font-bold">{profileData.name}</h2>
            <p className="text-gray-600">{profileData.email}</p>
            <div className="flex mt-2">
              <p className="mr-4"><span className="font-medium">{profileData.followers.length}</span> Followers</p>
              <p><span className="font-medium">{profileData.following.length}</span> Following</p>
            </div>
          </div>
        </div>
      </div>
      
      <h3 className="text-xl font-bold mb-4">Your Posts ({userPosts.length})</h3>
      <div className="space-y-6">
        {userPosts.length > 0 ? (
          userPosts.map(post => (
            <div key={post._id} className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-bold">{post.title}</h4>
              <p className="mt-2">{post.body}</p>
              {post.photo && (
                <img 
                  src={post.photo} 
                  alt={post.title} 
                  className="mt-3 w-full h-auto rounded"
                />
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">You haven't posted anything yet</p>
        )}
      </div>
    </div>
  );
};

export default Profile;