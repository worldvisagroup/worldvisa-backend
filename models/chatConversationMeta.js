const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['client', 'staff'], required: true },
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { _id: false }
);

const chatConversationMetaSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatConversation',
    required: true,
    index: true,
  },
  participant: {
    type: participantSchema,
    required: true,
    index: true,
  },
  lastReadAt: {
    type: Date,
    default: null,
  },
  clearedAt: {
    type: Date,
    default: null,
  },
  muted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

chatConversationMetaSchema.index(
  { conversationId: 1, 'participant.type': 1, 'participant.id': 1 },
  { unique: true }
);
chatConversationMetaSchema.index({ 'participant.type': 1, 'participant.id': 1 });

const ChatConversationMeta = mongoose.model('ChatConversationMeta', chatConversationMetaSchema);

module.exports = ChatConversationMeta;
