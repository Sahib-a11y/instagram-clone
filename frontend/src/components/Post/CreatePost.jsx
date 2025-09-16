import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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

    console.log("🔥 Selected file:", {
      name: file.name,
      type: file.type,
      size: file.size
    });

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
      console.log("🔥 Uploading to:", `${process.env.REACT_APP_API_URL}/upload`);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      console.log("🔥 Upload response status:", response.status);
      const data = await response.json();
      console.log("🔥 Upload response data:", data);

      if (response.ok) {
        setFormData(prev => ({ ...prev, pic: data.url }));
        console.log("✅ Upload successful:", data.url);
      } else {
        console.error("❌ Upload failed:", data);
        alert(data.error || 'Image upload failed');
        setPreviewImage(null);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('Image upload failed: ' + error.message);
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

export default CreatePost