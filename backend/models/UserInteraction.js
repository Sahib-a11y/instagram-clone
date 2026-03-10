import mongoose from "mongoose";

const userInteractionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "post",
    required: true,
  },
  interactionType: {
    type: String,
    enum: ["like", "comment", "save", "share", "view", "follow"],
    required: true,
  },
  weight: {
    type: Number,
    default: 1,
    min: 0,
    max: 5,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    watchTime: Number, // for views
    commentLength: Number, // for comments
    sharePlatform: String, // for shares
  },
}, {
  timestamps: true,
  // Compound index for efficient queries
  indexes: [
    { user: 1, interactionType: 1, timestamp: -1 },
    { post: 1, interactionType: 1 },
    { user: 1, post: 1, interactionType: 1 },
  ]
});

// Static method to get user interests
userInteractionSchema.statics.getUserInterests = async function(userId) {
  const interactions = await this.find({
    user: userId,
    timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
  }).populate('post', 'title body').sort({ timestamp: -1 });

  const interests = {
    topics: {},
    creators: {},
    contentTypes: {},
    engagementPatterns: {
      totalLikes: 0,
      totalComments: 0,
      totalSaves: 0,
      totalShares: 0,
      totalViews: 0,
    }
  };

  interactions.forEach(interaction => {
    // Extract topics from post content (simple keyword extraction)
    const content = `${interaction.post?.title || ''} ${interaction.post?.body || ''}`.toLowerCase();
    const keywords = content.match(/\b\w{4,}\b/g) || [];

    keywords.forEach(keyword => {
      if (!interests.topics[keyword]) interests.topics[keyword] = 0;
      interests.topics[keyword] += interaction.weight;
    });

    // Track creators
    if (interaction.post?.postedBy) {
      const creatorId = interaction.post.postedBy.toString();
      if (!interests.creators[creatorId]) interests.creators[creatorId] = 0;
      interests.creators[creatorId] += interaction.weight;
    }

    // Track engagement patterns
    switch (interaction.interactionType) {
      case 'like': interests.engagementPatterns.totalLikes += interaction.weight; break;
      case 'comment': interests.engagementPatterns.totalComments += interaction.weight; break;
      case 'save': interests.engagementPatterns.totalSaves += interaction.weight; break;
      case 'share': interests.engagementPatterns.totalShares += interaction.weight; break;
      case 'view': interests.engagementPatterns.totalViews += interaction.weight; break;
    }
  });

  return interests;
};

// Static method to calculate relationship strength
userInteractionSchema.statics.getRelationshipStrength = async function(userId, creatorId) {
  const user = await mongoose.model('User').findById(userId);
  if (!user) return 0;

  // Direct following
  if (user.following.includes(creatorId)) return 20;

  // Mutual following (creator follows user back)
  const creator = await mongoose.model('User').findById(creatorId);
  if (creator && creator.following.includes(userId)) return 25;

  // Shared connections (common followers/following)
  const sharedFollowers = user.followers.filter(id =>
    creator && creator.followers.includes(id)
  ).length;

  const sharedFollowing = user.following.filter(id =>
    creator && creator.following.includes(id)
  ).length;

  const sharedConnections = sharedFollowers + sharedFollowing;

  // Base score for shared connections
  return Math.min(sharedConnections * 2, 10);
};

export default mongoose.model("UserInteraction", userInteractionSchema);
