import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import LoadingSpinner from '../common/LoadingSpinner';
import { FaCamera, FaVideo, FaTimes, FaUpload } from 'react-icons/fa';
import getApiUrl from '../../utils/api';

const CreateStory = ({ onNavigate, onStoryCreated }) => {
  const { token } = useAuth();
  const socket = useSocket();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isHighlight, setIsHighlight] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image or video file');
      return;
    }

    // Validate file size (max 50MB for videos, 10MB for images)
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File size should be less than ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    setSelectedFile(file);
    setMediaType(file.type.startsWith('video/') ? 'video' : 'image');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !mediaType) {
      alert('Please select a file first');
      return;
    }

    setLoading(true);
    setUploading(true);

    try {
      // Create FormData for file upload and story creation
      const formData = new FormData();
      formData.append('media', selectedFile);
      formData.append('type', mediaType);
      formData.append('isHighlight', isHighlight.toString());

      // Upload file and create story in one request
      const response = await fetch(getApiUrl('story/upload'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        alert('Story created successfully! It will be visible for 24 hours.');

        // Emit socket event for story creation notification
        if (socket && socket.sendMessage) {
          socket.sendMessage('story_created', { storyId: data.story._id });
        }

        onStoryCreated && onStoryCreated();
        onNavigate('home');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to create story');
      }
    } catch (error) {
      console.error('Story creation error:', error);
      alert('Failed to create story: ' + error.message);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 py-4 px-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <button
            onClick={() => onNavigate('home')}
            className="text-gray-400 hover:text-white"
          >
            <FaTimes className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Create Story</h1>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || loading}
            className="px-4 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Share'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {!selectedFile ? (
            <div className="text-center py-12">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Share a moment</h2>
                <p className="text-gray-400">Upload a photo or video to create a story</p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <label className="block">
                  <div className="bg-gray-800 rounded-2xl p-8 cursor-pointer hover:bg-gray-700 transition-colors border-2 border-dashed border-gray-600 hover:border-indigo-500">
                    <FaCamera className="w-12 h-12 mx-auto mb-4 text-indigo-400" />
                    <span className="block text-sm font-medium">Photo</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>

                <label className="block">
                  <div className="bg-gray-800 rounded-2xl p-8 cursor-pointer hover:bg-gray-700 transition-colors border-2 border-dashed border-gray-600 hover:border-indigo-500">
                    <FaVideo className="w-12 h-12 mx-auto mb-4 text-indigo-400" />
                    <span className="block text-sm font-medium">Video</span>
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Preview */}
              <div className="relative max-w-md mx-auto">
                {mediaType === 'image' ? (
                  <img
                    src={previewUrl}
                    alt="Story preview"
                    className="w-full rounded-2xl object-cover"
                    style={{ maxHeight: '400px' }}
                  />
                ) : (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full rounded-2xl"
                    style={{ maxHeight: '400px' }}
                  />
                )}

                <button
                  onClick={removeFile}
                  className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-full">
                    <FaUpload className="w-4 h-4 animate-bounce" />
                    <span>Uploading to Cloudinary...</span>
                  </div>
                </div>
              )}

              {/* Highlights Option */}
              <div className="bg-gray-800 rounded-2xl p-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={isHighlight}
                    onChange={(e) => setIsHighlight(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 focus:ring-2"
                  />
                  <div>
                    <h3 className="font-semibold text-sm">Add to Highlights</h3>
                    <p className="text-xs text-gray-400">This story will be saved permanently in your profile highlights</p>
                  </div>
                </label>
              </div>

              {/* Info */}
              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="font-semibold mb-2">Story Info</h3>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>Type: {mediaType === 'image' ? 'Photo' : 'Video'}</p>
                  <p>Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  <p>Stories are visible for 24 hours</p>
                  {isHighlight && <p className="text-indigo-400">Will be saved as highlight</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateStory;
