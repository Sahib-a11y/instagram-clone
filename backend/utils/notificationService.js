import Notification from "../models/Notification.js";
import User from "../models/User.js";

export const createNotification = async (receiverId, senderId, type, message, postId = null, storyId = null) => {
  try {
    // Don't create notification for self-actions
    if (receiverId.toString() === senderId.toString()) {
      return null;
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) return null;

    // For follow notifications on public accounts, don't create if private
    // Follow requests should always create notifications
    if (type === 'new_follower' && receiver.isPrivate) {
      return null;
    }

    const notification = await Notification.create({
      receiverId,
      senderId,
      type,
      message,
      postId,
      storyId,
    });

    // Emit notification via socket if user is online
    try {
      const appModule = await import('../index.js');
      const app = appModule.default;
      const io = app.get('io');
      if (io) {
        const populatedNotification = await Notification.findById(notification._id)
          .populate('senderId', 'name pic')
          .populate('receiverId', 'name pic');

        io.to(`user_${receiverId}`).emit('new_notification', {
          notification: populatedNotification
        });
      }
    } catch (socketError) {
      console.error('Socket emission error:', socketError);
    }

    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
    return null;
  }
};

export const createFollowNotification = async (followerId, followedId) => {
  const message = "started following you";
  return await createNotification(followedId, followerId, "new_follower", message);
};

export const createFollowRequestNotification = async (requesterId, targetId) => {
  const message = "sent you a follow request";
  return await createNotification(targetId, requesterId, "follow_request", message);
};

export const createFollowRequestAcceptedNotification = async (acceptorId, requesterId) => {
  const message = "accepted your follow request";
  return await createNotification(requesterId, acceptorId, "follow_request_accepted", message);
};

export const createPostLikeNotification = async (likerId, postOwnerId, postId) => {
  const message = "liked your post";
  return await createNotification(postOwnerId, likerId, "post_like", message, postId);
};

export const createPostCommentNotification = async (commenterId, postOwnerId, postId) => {
  const message = "commented on your post";
  return await createNotification(postOwnerId, commenterId, "post_comment", message, postId);
};

export const createStoryReplyNotification = async (replierId, storyOwnerId, storyId) => {
  const message = "replied to your story";
  return await createNotification(storyOwnerId, replierId, "story_reply", message, null, storyId);
};
