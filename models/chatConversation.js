const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['client', 'staff'], required: true },
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { _id: false }
);
const chatConversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['dm', 'group'],
    required: true,
  },
  participants: {
    type: [participantSchema],
    required: true,
    validate: {
      validator(v) {
        if (this.type === 'dm') return Array.isArray(v) && v.length === 2;
        return Array.isArray(v) && v.length >= 1;
      },
      message: 'DM must have exactly 2 participants',
    },
  },
  name: {
    type: String,
    required: function () {
      return this.type === 'group';
    },
    default: null,
  },
  description: {
    type: String,
    default: null,
  },
  imageUrl: {
    type: String,
    default: null,
  },
  createdBy: {
    type: participantSchema,
    required: true,
  },
  lastMessageAt: {
    type: Date,
    default: null,
  },
  archivedBy: {
    type: [participantSchema],
    default: [],
  },
}, {
  timestamps: true,
});

chatConversationSchema.index({ type: 1 });
chatConversationSchema.index({ lastMessageAt: -1 });
chatConversationSchema.index({ 'participants.type': 1, 'participants.id': 1 });

const ChatConversation = mongoose.model('ChatConversation', chatConversationSchema);

module.exports = ChatConversation;
