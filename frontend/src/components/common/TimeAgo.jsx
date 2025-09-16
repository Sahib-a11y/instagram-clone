import React, { useState, useEffect } from 'react';

const TimeAgo = ({ date, className = "" }) => {
  const [timeAgo, setTimeAgo] = useState('');

  const calculateTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const weeks = Math.floor(diff / 604800000);
    const months = Math.floor(diff / 2629746000);
    const years = Math.floor(diff / 31556952000);
    
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (weeks < 4) return `${weeks}w ago`;
    if (months < 12) return `${months}mo ago`;
    return `${years}y ago`;
  };

  useEffect(() => {
    
    setTimeAgo(calculateTimeAgo(date));

    
    const interval = setInterval(() => {
      setTimeAgo(calculateTimeAgo(date));
    }, 30000); 

    return () => clearInterval(interval);
  }, [date]);

  return <span className={className}>{timeAgo}</span>;
};

export default TimeAgo;