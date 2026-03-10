import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import getApiUrl from '../utils/api';

const useCreatePost = (onPostCreated) => {
  const { token, user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewImage(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.body.trim()) {
      alert('Please fill in title and description');
      return;
    }

    if (!selectedFile) {
      alert('Please select an image');
      return;
    }

    setLoading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('title', formData.title.trim());
    uploadFormData.append('body', formData.body.trim());
    uploadFormData.append('image', selectedFile);

    try {
      const response = await fetch(getApiUrl('createPost'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      const data = await response.json();

      if (response.ok) {
        setFormData({ title: '', body: '' });
        setSelectedFile(null);
        setPreviewImage(null);
        setIsExpanded(false);
        onPostCreated && onPostCreated();
      } else {
        alert(data.error || data.message || 'Failed to create post');
      }
    } catch (error) {
      alert('Failed to create post: ' + error.message);
    }
    setLoading(false);
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewImage(null);
  };

  const resetForm = () => {
    setFormData({ title: '', body: '' });
    setSelectedFile(null);
    setPreviewImage(null);
    setIsExpanded(false);
  };

  return {
    isExpanded,
    setIsExpanded,
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
  };
};

export default useCreatePost;
