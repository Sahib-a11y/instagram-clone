import express from 'express';
import Post from '../models/Post.js';
import User from '../models/User.js';
import UserInteraction from '../models/UserInteraction.js';
import requireLogin from '../middleware/requireLogin.js';

const router = express.Router();

// Helper function to calculate post score
async function calculatePostScore(post, userId, userInterests, relationshipStrength) {
  let score = 0;

  // 1. Relationship Strength (0-30 points)
  score += relationshipStrength;

  // 2. Content Relevance (0-25 points)
  if (userInterests && userInterests.topics) {
    const postContent = `${post.title} ${post.body}`.toLowerCase();
    let relevanceScore = 0;

    Object.keys(userInterests.topics).forEach(topic => {
      if (postContent.includes(topic.toLowerCase())) {
        relevanceScore += userInterests.topics[topic] * 0.1; // Weight topic matches
      }
    });

    score += Math.min(relevanceScore, 25);
  }

  // 3. Engagement/Popularity (0-25 points)
  const postAge = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60); // Hours old
  const likesPerHour = post.like.length / Math.max(postAge, 1);
  const commentsPerHour = post.Comment.length / Math.max(postAge, 1);

  const engagementScore = Math.min((likesPerHour * 2 + commentsPerHour * 5), 25);
  score += engagementScore;

  // 4. Recency (0-20 points)
  let recencyScore = 0;
  if (postAge < 1) recencyScore = 20;
  else if (postAge < 6) recencyScore = 15;
  else if (postAge < 24) recencyScore = 10;
  else if (postAge < 168) recencyScore = 5; // 1 week
  else recencyScore = 0;

  score += recencyScore;

  return Math.min(Math.max(score, 0), 100); // Clamp between 0-100
}

// Get personalized feed
router.get('/', requireLogin, async (req, res) => {
  try {
    const userId = req.Userdata._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get user profile and following list
    const user = await User.findById(userId).populate('following', '_id');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user interests from interactions
    const userInterests = await UserInteraction.getUserInterests(userId);

    // Build candidate posts query
    const followingIds = user.following.map(f => f._id);
    followingIds.push(userId); // Include own posts

    // For new users (less than 10 interactions), show trending content
    const isNewUser = !userInterests || Object.keys(userInterests.topics || {}).length < 10;

    let candidatePosts;
    if (isNewUser) {
      // New user: Show trending posts and popular content
      candidatePosts = await Post.find({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      })
      .populate('postedBy', 'name pic email')
      .populate('Comment.postedBy', 'name pic email')
      .sort({ createdAt: -1 })
      .limit(100); // Get more candidates for scoring
    } else {
      // Regular user: Show posts from following + some discovery content
      candidatePosts = await Post.find({
        $or: [
          { postedBy: { $in: followingIds } },
          {
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
            like: { $size: { $gte: 5 } } // Popular posts
          }
        ]
      })
      .populate('postedBy', 'name pic email')
      .populate('Comment.postedBy', 'name pic email')
      .sort({ createdAt: -1 })
      .limit(200); // Get more candidates for scoring
    }

    // Calculate scores for each post
    const scoredPosts = await Promise.all(
      candidatePosts.map(async (post) => {
        const relationshipStrength = await UserInteraction.getRelationshipStrength(
          userId,
          post.postedBy._id
        );

        const score = await calculatePostScore(post, userId, userInterests, relationshipStrength);

        return {
          post,
          score,
          relationshipStrength,
          isFollowing: followingIds.includes(post.postedBy._id.toString())
        };
      })
    );

    // Sort by score descending
    scoredPosts.sort((a, b) => b.score - a.score);

    // Apply diversity: No more than 3 posts from same creator in top 20
    const finalPosts = [];
    const creatorCounts = new Map();

    for (const item of scoredPosts) {
      const creatorId = item.post.postedBy._id.toString();
      const currentCount = creatorCounts.get(creatorId) || 0;

      if (finalPosts.length < 20 || currentCount < 3) {
        finalPosts.push(item.post);
        creatorCounts.set(creatorId, currentCount + 1);
      }

      if (finalPosts.length >= limit) break;
    }

    // Pagination
    const paginatedPosts = finalPosts.slice(skip, skip + limit);

    res.json({
      posts: paginatedPosts,
      pagination: {
        page,
        limit,
        total: finalPosts.length,
        hasMore: skip + limit < finalPosts.length
      },
      metadata: {
        isNewUser,
        totalCandidates: candidatePosts.length,
        algorithm: 'socialpulse_v1'
      }
    });

  } catch (error) {
    console.error('Feed generation error:', error);
    res.status(500).json({
      error: 'Failed to generate feed',
      message: error.message
    });
  }
});

// Track user interactions for learning
router.post('/interact', requireLogin, async (req, res) => {
  try {
    const { postId, interactionType, metadata } = req.body;
    const userId = req.Userdata._id;

    if (!postId || !interactionType) {
      return res.status(400).json({ error: 'postId and interactionType are required' });
    }

    // Validate interaction type
    const validTypes = ['like', 'comment', 'save', 'share', 'view', 'follow'];
    if (!validTypes.includes(interactionType)) {
      return res.status(400).json({ error: 'Invalid interaction type' });
    }

    // Calculate weight based on interaction type
    let weight = 1;
    switch (interactionType) {
      case 'like': weight = 2; break;
      case 'comment': weight = 3; break;
      case 'save': weight = 4; break;
      case 'share': weight = 5; break;
      case 'view': weight = 1; break;
      case 'follow': weight = 3; break;
    }

    // Create or update interaction
    const interaction = await UserInteraction.findOneAndUpdate(
      {
        user: userId,
        post: postId,
        interactionType
      },
      {
        weight,
        timestamp: new Date(),
        metadata
      },
      {
        upsert: true,
        new: true
      }
    );

    res.json({
      message: 'Interaction recorded',
      interaction
    });

  } catch (error) {
    console.error('Interaction tracking error:', error);
    res.status(500).json({
      error: 'Failed to record interaction',
      message: error.message
    });
  }
});

export default router;
