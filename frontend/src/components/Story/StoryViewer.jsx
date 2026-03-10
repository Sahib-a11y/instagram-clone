import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaTimes, FaChevronLeft, FaChevronRight, FaPause, FaPlay } from 'react-icons/fa';
import getApiUrl from '../../utils/api';

const StoryViewer = ({ stories, currentIndex, onClose, onNavigate }) => {
  const { token } = useAuth();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(currentIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewedStories, setViewedStories] = useState(new Set());

  const currentStory = stories[currentStoryIndex];

  // Mark story as viewed
  const markAsViewed = useCallback(async (storyId) => {
    if (viewedStories.has(storyId)) return;

    try {
      await fetch(getApiUrl(`story/${storyId}/view`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setViewedStories(prev => new Set([...prev, storyId]));
    } catch (error) {
      console.error('Error marking story as viewed:', error);
    }
  }, [token, viewedStories]);

  // Auto-progress through stories
  useEffect(() => {
    if (!currentStory || isPaused) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Move to next story
          if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
            return 0;
          } else {
            // Close viewer when all stories are viewed
            onClose();
            return 0;
          }
        }
        return prev + 2; // Progress at 2% per 100ms (5 seconds total)
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentStoryIndex, stories.length, isPaused, currentStory, onClose]);

  // Mark current story as viewed when it loads
  useEffect(() => {
    if (currentStory) {
      markAsViewed(currentStory._id);
    }
  }, [currentStory, markAsViewed]);

  const handleNext = useCallback(() => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentStoryIndex, stories.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    }
  }, [currentStoryIndex]);

  const togglePause = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused]);

  const handleKeyPress = useCallback((e) => {
    switch (e.key) {
      case 'ArrowRight':
        handleNext();
        break;
      case 'ArrowLeft':
        handlePrev();
        break;
      case ' ':
        e.preventDefault();
        togglePause();
        break;
      case 'Escape':
        onClose();
        break;
      default:
        break;
    }
  }, [handleNext, handlePrev, togglePause, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white hover:text-gray-300"
      >
        <FaTimes className="w-6 h-6" />
      </button>

      {/* Progress Bars */}
      <div className="absolute top-2 left-4 right-4 flex space-x-1 z-10">
        {stories.map((story, index) => (
          <div
            key={story._id}
            className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: index < currentStoryIndex ? '100%' :
                       index === currentStoryIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Story Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Left Navigation */}
        {currentStoryIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
          >
            <FaChevronLeft className="w-8 h-8" />
          </button>
        )}

        {/* Story Media */}
        <div className="relative max-w-md max-h-full">
          {currentStory.type === 'text' ? (
            <div className="w-80 h-96 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center p-8">
              <div className="text-center text-white">
                <div className="text-4xl mb-4">{currentStory.textContent}</div>
                <div className="text-sm opacity-80">Text Story</div>
              </div>
            </div>
          ) : currentStory.type === 'image' ? (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="max-w-full max-h-full object-contain rounded-2xl"
            />
          ) : (
            <video
              src={currentStory.mediaUrl}
              controls={false}
              autoPlay
              muted
              className="max-w-full max-h-full object-contain rounded-2xl"
            />
          )}
        </div>

        {/* Right Navigation */}
        {currentStoryIndex < stories.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
          >
            <FaChevronRight className="w-8 h-8" />
          </button>
        )}

        {/* Pause/Play Button */}
        <button
          onClick={togglePause}
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white hover:text-gray-300 z-10"
        >
          {isPaused ? <FaPlay className="w-6 h-6" /> : <FaPause className="w-6 h-6" />}
        </button>

        {/* User Info */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white z-10">
          <div className="flex items-center space-x-3">
            <img
              src={currentStory.user?.pic || '/default-avatar.png'}
              alt={currentStory.user?.name}
              className="w-8 h-8 rounded-full border-2 border-white"
            />
            <div>
              <div className="font-semibold">{currentStory.user?.name}</div>
              <div className="text-sm opacity-80">
                {currentStory.viewers?.length || 0} views
              </div>
            </div>
          </div>
          <div className="text-sm opacity-80">
            {Math.floor((Date.now() - new Date(currentStory.createdAt)) / (1000 * 60))}m ago
          </div>
        </div>
      </div>

      {/* Invisible click areas for navigation */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
        onClick={handlePrev}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
        onClick={handleNext}
      />
    </div>
  );
};

export default StoryViewer;
