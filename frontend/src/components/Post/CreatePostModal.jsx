import React from 'react';
import { FaImage, FaTimes } from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';
import useCreatePost from '../../hooks/useCreatePost';

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const {
    formData,
    setFormData,
    selectedFile,
    previewImage,
    loading,
    handleImageSelect,
    handleSubmit,
    removeImage,
    resetForm,
    user
  } = useCreatePost(onPostCreated);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Create Post</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-start space-x-4">
          {user?.pic && (
            <img
              src={user.pic}
              alt="User profile"
              className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500"
            />
          )}
          <div className="flex-1">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Post title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={100}
              />

              <textarea
                placeholder="What's on your mind?"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                maxLength={500}
              />

              {previewImage && (
                <div className="relative inline-block w-48 h-48">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-xl border-2 border-gray-700"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                <label className="flex items-center space-x-2 cursor-pointer text-indigo-400 hover:text-indigo-300">
                  <FaImage className="w-5 h-5" />
                  <span className="text-sm">
                    {selectedFile ? 'Change Photo' : 'Add Photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={loading}
                  />
                </label>

                <div className="flex space-x-2">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !formData.title.trim() || !formData.body.trim() || !selectedFile}
                    className="px-6 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center space-x-2"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : <span>Post</span>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
