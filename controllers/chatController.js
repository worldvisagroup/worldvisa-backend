const ChatConversation = require('../models/chatConversation');
const ChatMessage = require('../models/chatMessage');
const ChatConversationMeta = require('../models/chatConversationMeta');
const ZohoDmsUser = require('../models/zohoDmsUser');
const DmsZohoClient = require('../models/dmsZohoClient');
const chatAuthService = require('../services/chatAuthService');
const presenceService = require('../services/presenceService');
const { uploadToR2 } = require('../services/r2Client');
const { addNotificationAndEmit } = require('./helper/service/notifications');
const { getChatReminderQueue } = require('../queues/chatReminderQueue');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// ---------- Helpers ----------


async function resolveParticipantInfo(participant) {
  if (!participant || !participant.type || !participant.id) return null;

  const presence = await presenceService.getPresence(participant.id.toString());

  if (participant.type === 'staff') {
    const u = await ZohoDmsUser.findById(participant.id)
      .select('username profile_image_url')
      .lean();
    return u
      ? {
          displayName: u.username,
          profile_image_url: u.profile_image_url ?? null,
          online_status: presence.status !== 'offline',   // backward compat boolean
          presence_status: presence.status,               // 'online' | 'idle' | 'offline'
          lastSeen: presence.lastSeen,
        }
      : null;
  }

  const c = await DmsZohoClient.findById(participant.id)
    .select('name email')
    .lean();
  return c
    ? {
        displayName: c.name || c.email,
        profile_image_url: null,
        online_status: presence.status !== 'offline',
        presence_status: presence.status,
        lastSeen: presence.lastSeen,
      }
    : null;
}

async function resolveParticipantDisplayName(participant) {
  const info = await resolveParticipantInfo(participant);
  return info ? info.displayName : null;
}

async function getUnreadCount(conversationId, actor) {
  const meta = await ChatConversationMeta.findOne({
    conversationId,
    'participant.type': actor.type,
    'participant.id': actor.id,
  }).lean();
  const lastReadAt = meta?.lastReadAt || new Date(0);
  const count = await ChatMessage.countDocuments({
    conversationId,
    createdAt: { $gt: lastReadAt },
    deletedAt: null,
    'sender.id': { $ne: actor.id },
  });
  return count;
}

function participantMatch(a, b) {
  return a && b && a.type === b.type && a.id.toString() === b.id.toString();
}

// ---------- List conversations ----------

exports.listConversations = async (req, res) => {
  try {
    const actor = req.chatActor;
    const page = Math.max(parseInt(req.query.page, 10) || DEFAULT_PAGE, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, MAX_LIMIT);
    const type = req.query.type;
    const search = (req.query.search || '').trim();
    const archived = req.query.archived === 'true';

    const match = {
      participants: { $elemMatch: { type: actor.type, id: actor.id } },
    };
    if (type === 'dm' || type === 'group') match.type = type;
    if (archived) {
      match.archivedBy = { $elemMatch: { type: actor.type, id: actor.id } };
    } else {
      match.$or = [
        { archivedBy: { $exists: false } },
        { archivedBy: [] },
        { archivedBy: { $not: { $elemMatch: { type: actor.type, id: actor.id } } } },
      ];
    }

    const skip = (page - 1) * limit;
    const [conversations, total] = await Promise.all([
      ChatConversation.find(match).sort({ lastMessageAt: -1, updatedAt: -1 }).skip(skip).limit(limit).lean(),
      ChatConversation.countDocuments(match),
    ]);

    const list = [];
    for (const conv of conversations) {
      const unreadCount = await getUnreadCount(conv._id, actor);
      let lastMessage = null;
      if (conv.lastMessageAt) {
        lastMessage = await ChatMessage.findOne({ conversationId: conv._id, deletedAt: null })
          .sort({ createdAt: -1 })
          .select('content sender createdAt')
          .lean();
      }
      let otherDisplayName = null;
      let otherParticipant = undefined;
      if (conv.type === 'dm') {
        const other = conv.participants.find((p) => !participantMatch(p, actor));
        if (other) {
          const info = await resolveParticipantInfo(other);
          if (info) {
            otherDisplayName = info.displayName;
            otherParticipant = {
              type: other.type,
              id: other.id,
              displayName: info.displayName,
              profile_image_url: info.profile_image_url,
              online_status: info.online_status,
            };
          }
        }
      }
      if (search) {
        const searchLower = search.toLowerCase();
        const nameMatch = conv.name && conv.name.toLowerCase().includes(searchLower);
        const otherMatch = otherDisplayName && otherDisplayName.toLowerCase().includes(searchLower);
        if (!nameMatch && !otherMatch) continue;
      }
      list.push({
        ...conv,
        unreadCount,
        lastMessage: lastMessage ? { content: lastMessage.content, sender: lastMessage.sender, createdAt: lastMessage.createdAt } : null,
        otherDisplayName: conv.type === 'dm' ? otherDisplayName : undefined,
        otherParticipant,
      });
    }

    res.status(200).json({
      status: 'success',
      data: list,
      total,
      page,
      limit,
    });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || 'Failed to list conversations' });
  }
};

// ---------- Get one conversation ----------

exports.getConversation = async (req, res) => {
  try {
    const actor = req.chatActor;
    const { conversationId } = req.params;
    const conv = await ChatConversation.findById(conversationId).lean();
    if (!conv) return res.status(404).json({ status: 'fail', message: 'Conversation not found' });
    if (!chatAuthService.canAccessConversation(actor, conv)) {
      return res.status(403).json({ status: 'fail', message: 'Access denied' });
    }
    const unreadCount = await getUnreadCount(conv._id, actor);
    const members = await Promise.all(
      conv.participants.map(async (p) => {
        const info = await resolveParticipantInfo(p);
        return {
          type: p.type,
          id: p.id,
          displayName: info ? info.displayName : null,
          profile_image_url: info ? info.profile_image_url : null,
          online_status: info ? info.online_status : false,
          presence_status: info ? info.presence_status : 'offline',
          lastSeen: info ? info.lastSeen : null,
        };
      })
    );
    res.status(200).json({
      status: 'success',
      data: { ...conv, unreadCount, members },
    });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || 'Failed to get conversation' });
  }
};

// ---------- Get messages ----------

exports.getMessages = async (req, res) => {
  try {
    const actor = req.chatActor;
    const { conversationId } = req.params;
    const before = req.query.before;
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, MAX_LIMIT);

    const conv = await ChatConversation.findById(conversationId).lean();
    if (!conv) return res.status(404).json({ status: 'fail', message: 'Conversation not found' });
    if (!chatAuthService.canAccessConversation(actor, conv)) {
      return res.status(403).json({ status: 'fail', message: 'Access denied' });
    }

    const meta = await ChatConversationMeta.findOne({
      conversationId,
      'participant.type': actor.type,
      'participant.id': actor.id,
    }).lean();
    const clearedAt = meta?.clearedAt || new Date(0);

    const query = { conversationId, deletedAt: null, createdAt: { $gt: clearedAt } };
    if (before) {
      const beforeDate = mongoose.Types.ObjectId.isValid(before)
        ? (await ChatMessage.findById(before).select('createdAt').lean())?.createdAt
        : new Date(before);
      if (beforeDate) query.createdAt.$lt = beforeDate;
    }
    const messages = await ChatMessage.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    res.status(200).json({ status: 'success', data: messages.reverse() });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || 'Failed to get messages' });
  }
};

// ---------- Create conversation (DM or group) ----------

exports.createConversation = async (req, res) => {
  try {
    const actor = req.chatActor;
    const actorWithRole = chatAuthService.withRole(actor, req.user);
    const { type, participant, participants, name, description, imageUrl } = req.body;

    if (type === 'dm') {
      if (!participant) return res.status(400).json({ status: 'fail', message: 'participant required for DM' });
      const actorWithRole = chatAuthService.withRole(actor, req.user);
      const allowed = await chatAuthService.canInitiateDm(actorWithRole, participant);
      if (!allowed) return res.status(403).json({ status: 'fail', message: 'Not allowed to start DM with this participant' });
      const p1 = { type: actor.type, id: actor.id };
      const p2 = { type: participant.type, id: participant.id };
      let conv = await ChatConversation.findOne({
        type: 'dm',
        $and: [
          { participants: { $elemMatch: { type: p1.type, id: p1.id } } },
          { participants: { $elemMatch: { type: p2.type, id: p2.id } } },
          { 'participants.1': { $exists: true } },
        ],
      });
      if (!conv) {
        conv = await ChatConversation.create({
          type: 'dm',
          participants: [p1, p2],
          createdBy: actor,
        });
      }
      return res.status(200).json({ status: 'success', data: conv });
    }

    if (type === 'group') {
      if (!chatAuthService.canCreateGroup(actorWithRole)) return res.status(403).json({ status: 'fail', message: 'Only master_admin, supervisor, or team_leader can create groups' });
      if (!name || !Array.isArray(participants) || participants.length < 1) {
        return res.status(400).json({ status: 'fail', message: 'name and participants (array) required for group' });
      }
      const all = [{ type: actor.type, id: actor.id }, ...participants];
      const unique = Array.from(new Map(all.map((p) => [p.type + p.id.toString(), p])).values());
      const conv = await ChatConversation.create({
        type: 'group',
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        participants: unique,
        createdBy: actor,
      });
      return res.status(201).json({ status: 'success', data: conv });
    }

    return res.status(400).json({ status: 'fail', message: 'type must be dm or group' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || 'Failed to create conversation' });
  }
};

// ---------- Update conversation (group name, description, image) ----------

exports.updateConversation = async (req, res) => {
  try {
    const actor = req.chatActor;
    const actorWithRole = chatAuthService.withRole(actor, req.user);
    const { conversationId } = req.params;
    const { name, description, imageUrl } = req.body;

    const conv = await ChatConversation.findById(conversationId);
    if (!conv) return res.status(404).json({ status: 'fail', message: 'Conversation not found' });
    if (conv.type !== 'group') return res.status(400).json({ status: 'fail', message: 'Only groups can be updated' });
    if (!chatAuthService.canAccessConversation(actor, conv)) return res.status(403).json({ status: 'fail', message: 'Access denied' });
    if (!chatAuthService.canAddToGroup(actorWithRole)) return res.status(403).json({ status: 'fail', message: 'Only master_admin, supervisor, or team_leader can update group' });

    if (name !== undefined) conv.name = name;
    if (description !== undefined) conv.description = description;
    if (imageUrl !== undefined) conv.imageUrl = imageUrl;
    await conv.save();
    res.status(200).json({ status: 'success', data: conv });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || 'Failed to update conversation' });
  }
};

// ---------- Update group participants ----------

exports.updateParticipants = async (req, res) => {
  try {
    const actor = req.chatActor;
    const actorWithRole = chatAuthService.withRole(actor, req.user);
    const { conversationId } = req.params;
    const { add = [], remove = [] } = req.body;

    const conv = await ChatConversation.findById(conversationId);
    if (!conv) return res.status(404).json({ status: 'fail', message: 'Conversation not found' });
    if (conv.type !== 'group') return res.status(400).json({ status: 'fail', message: 'Not a group' });
    if (!chatAuthService.canAddToGroup(actorWithRole)) return res.status(403).json({ status: 'fail', message: 'Not allowed to modify participants' });

    const toAdd = Array.isArray(add) ? add : [];
    const toRemove = Array.isArray(remove) ? remove : [];
    for (const p of toAdd) {
      if (!conv.participants.some((x) => participantMatch(x, p))) {
        conv.participants.push({ type: p.type, id: p.id });
      }
    }
    conv.participants = conv.participants.filter((p) => !toRemove.some((r) => participantMatch(p, r)));
    if (conv.participants.length === 0) {
      await conv.deleteOne();
      return res.status(200).json({ status: 'success', data: null, message: 'Conversation removed (no participants left)' });
    }
    await conv.save();
    res.status(200).json({ status: 'success', data: conv });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || 'Failed to update participants' });
  }
};

// ---------- Send message ----------

exports.sendMessage = async (req, res) => {
  try {
    const actor = req.chatActor;
    const { conversationId } = req.params;
    const body = req.body || {};
    let content = body.content;
    let attachmentList = Array.isArray(body.attachments) ? body.attachments : [];
    const forwardedFromMessageId = body.forwardedFromMessageId || null;

    const conv = await ChatConversation.findById(conversationId);
    if (!conv) return res.status(404).json({ status: 'fail', message: 'Conversation not found' });
    if (!chatAuthService.canAccessConversation(actor, conv)) return res.status(403).json({ status: 'fail', message: 'Access denied' });

    if (Array.isArray(req.files) && req.files.length) {
      for (const file of req.files) {
        if (!file.buffer) continue;
        const key = `chat-attachments/${conversationId}/${Date.now()}-${(file.originalname || 'file').replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const url = await uploadToR2(key, file.buffer, file.mimetype || 'application/octet-stream');
        attachmentList.push({ url, name: file.originalname || 'file', contentType: file.mimetype || 'application/octet-stream', size: file.size || 0 });
      }
    }
    if (Array.isArray(body.attachmentIds) && body.attachmentIds.length) {
      attachmentList = attachmentList.concat(body.attachmentIds.map((a) => (typeof a === 'object' && a.url ? a : null)).filter(Boolean));
    }

    const msg = await ChatMessage.create({
      conversationId: conv._id,
      sender: actor,
      content: content || null,
      attachments: attachmentList,
      forwardedFromMessageId,
    });
    conv.lastMessageAt = msg.createdAt;
    await conv.save();

    // Increment support_ratio when staff replies in a conversation that has clients (fire-and-forget)
    if (actor.type === 'staff' && conv.participants.some(p => p.type === 'client')) {
      const increment = parseInt(process.env.CHAT_REPLY_RATIO_INCREMENT || '2', 10);
      ZohoDmsUser.updateOne(
        { _id: actor.id },
        [{ $set: { support_ratio: { $min: [100, { $add: [{ $ifNull: ['$support_ratio', 100] }, increment] }] } } }]
      ).catch(() => {});
    }

    // Update last_communication_activity for client participants (fire-and-forget)
    const clientParticipants = conv.participants.filter(p => p.type === 'client');
    if (clientParticipants.length) {
      DmsZohoClient.updateMany(
        { _id: { $in: clientParticipants.map(p => p.id) } },
        { last_communication_activity: msg.createdAt, last_communication_provider: 'chat' }
      ).catch(() => {});
    }

    const io = req.app.get('io');
    if (io) {
      conv.participants.forEach((p) => {
        io.to(`chat:${p.type}:${p.id}`).emit('chat:message', { conversationId: conv._id, message: msg });
      });
    }

    // In-app notifications for recipients (non-fatal)
    try {
      const senderName = (await resolveParticipantDisplayName(actor)) ?? 'Someone';
      const title = conv.type === 'dm'
        ? `New message from ${senderName}`
        : `New message in ${conv.name || 'Group'}`;
      const snippet = (content && String(content).trim())
        ? (String(content).length > 80 ? `${String(content).slice(0, 80)}…` : String(content))
        : (attachmentList.length ? '[Attachment]' : 'New message');
      const link = `/v2/messages/${conv._id}`;
      const recipients = conv.participants.filter((p) => !participantMatch(p, actor));
      const results = await Promise.allSettled(
        recipients.map((p) =>
          addNotificationAndEmit({
            req,
            userId: p.id,
            message: snippet,
            title,
            link,
            type: 'info',
            category: 'chat',
            source: 'chat',
            sender_type: actor.type,
            sender_id: actor.id,
          })
        )
      );
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          logger.warn('Chat notification failed', {
            conversationId: conv._id,
            userId: recipients[i].id?.toString(),
            error: r.reason?.message,
          });
        }
      });
    } catch (notifErr) {
      logger.warn('Chat notifications error', {
        conversationId: conv._id,
        error: notifErr?.message,
      });
    }

    // Schedule unanswered-message reminder chain when a client sends a message (fire-and-forget)
    if (actor.type === 'client' && conv.participants.some(p => p.type === 'staff')) {
      setImmediate(async () => {
        try {
          const queue = getChatReminderQueue();
          const delay = parseInt(process.env.CHAT_REMINDER_DELAY_1_MS || '900000', 10);
          const jobId = `chat-reminder:${conv._id}:r1:${msg._id}`;
          await queue.add(
            'send-reminder',
            { conversationId: conv._id.toString(), triggerMessageId: msg._id.toString(), reminderCount: 1 },
            { delay, jobId }
          );
        } catch (err) {
          logger.warn('[Chat] Failed to enqueue reminder', { conversationId: conv._id, error: err?.message });
        }
      });
    }

    res.status(201).json({ status: 'success', data: msg });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || 'Failed to send message' });
  }
};

// ---------- Mark as read ----------

exports.markRead = async (req, res) => {
  try {
    const actor = req.chatActor;
    const { conversationId } = req.params;
    const { lastReadAt } = req.body;

    const conv = await ChatConversation.findById(conversationId).lean();
    if (!conv) return res.status(404).json({ status: 'fail', message: 'Conversation not found' });
    if (!chatAuthService.canAccessConversation(actor, conv)) return res.status(403).json({ status: 'fail', message: 'Access denied' });

    const at = lastReadAt ? new Date(lastReadAt) : new Date();
    await ChatConversationMeta.findOneAndUpdate(
      { conversationId, 'participant.type': actor.type, 'participant.id': actor.id },
      { $set: { lastReadAt: at } },
      { upsert: true, new: true }
    );

    const io = req.app.get('io');
    if (io) {
      conv.participants.forEach((p) => {
        if (!participantMatch(p, actor)) {
          io.to(`chat:${p.type}:${p.id}`).emit('chat:read', { conversationId, participant: actor, lastReadAt: at });
        }
      });
    }

    res.status(200).json({ status: 'success', data: { lastReadAt: at } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || 'Failed to mark as read' });
  }
};

// ---------- Clear conversation ----------

exports.clearConversation = async (req, res) => {
  try {
    const actor = req.chatActor;
    const { conversationId } = req.params;

    const conv = await ChatConversation.findById(conversationId).lean();
    if (!conv) return res.status(404).json({ status: 'fail', message: 'Conversation not found' });
    if (!chatAuthService.canAccessConversation(actor, conv)) return res.status(403).json({ status: 'fail', message: 'Access denied' });

    await ChatConversationMeta.findOneAndUpdate(
      { conversationId, 'participant.type': actor.type, 'participant.id': actor.id },
      { $set: { clearedAt: new Date() } },
      { upsert: true }
    );
    res.status(200).json({ status: 'success', message: 'Conversation cleared' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || 'Failed to clear conversation' });
  }
};

// ---------- Archive / unarchive conversation (for current user) ----------

exports.setArchiveConversation = async (req, res) => {
  try {
    const actor = req.chatActor;
    const { conversationId } = req.params;
    const archived = req.body.archived;

    if (typeof archived !== 'boolean') {
      return res.status(400).json({ status: 'fail', message: 'Body must include archived: true or archived: false' });
    }

    const conv = await ChatConversation.findById(conversationId);
    if (!conv) return res.status(404).json({ status: 'fail', message: 'Conversation not found' });
    if (!chatAuthService.canAccessConversation(actor, conv)) return res.status(403).json({ status: 'fail', message: 'Access denied' });

    if (!conv.archivedBy) conv.archivedBy = [];
    const inArchived = conv.archivedBy.some((p) => participantMatch(p, actor));

    if (archived && !inArchived) {
      conv.archivedBy.push(actor);
      await conv.save();
      return res.status(200).json({ status: 'success', data: conv, message: 'Conversation archived' });
    }
    if (!archived && inArchived) {
      conv.archivedBy = conv.archivedBy.filter((p) => !participantMatch(p, actor));
      await conv.save();
      return res.status(200).json({ status: 'success', data: conv, message: 'Conversation unarchived' });
    }
    res.status(200).json({ status: 'success', data: conv, message: archived ? 'Already archived' : 'Already unarchived' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || 'Failed to update archive state' });
  }
};

// ---------- Delete entire conversation (for everyone) ----------

exports.deleteConversation = async (req, res) => {
  try {
    const actor = req.chatActor;
    const { conversationId } = req.params;

    const conv = await ChatConversation.findById(conversationId);
    if (!conv) return res.status(404).json({ status: 'fail', message: 'Conversation not found' });
    if (!chatAuthService.canAccessConversation(actor, conv)) return res.status(403).json({ status: 'fail', message: 'Access denied' });

    await ChatMessage.deleteMany({ conversationId: conv._id });
    await ChatConversationMeta.deleteMany({ conversationId: conv._id });
    await conv.deleteOne();
    res.status(200).json({ status: 'success', message: 'Conversation deleted' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || 'Failed to delete conversation' });
  }
};

// ---------- Leave conversation ----------

exports.leaveConversation = async (req, res) => {
  try {
    const actor = req.chatActor;
    const { conversationId } = req.params;

    const conv = await ChatConversation.findById(conversationId);
    if (!conv) return res.status(404).json({ status: 'fail', message: 'Conversation not found' });
    if (!chatAuthService.canAccessConversation(actor, conv)) return res.status(403).json({ status: 'fail', message: 'Access denied' });

    if (conv.type === 'dm') {
      if (!conv.archivedBy) conv.archivedBy = [];
      if (!conv.archivedBy.some((p) => participantMatch(p, actor))) {
        conv.archivedBy.push(actor);
        await conv.save();
      }
      return res.status(200).json({ status: 'success', data: conv, message: 'DM archived' });
    }

    conv.participants = conv.participants.filter((p) => !participantMatch(p, actor));
    if (conv.participants.length === 0) {
      await ChatMessage.deleteMany({ conversationId: conv._id });
      await ChatConversationMeta.deleteMany({ conversationId: conv._id });
      await conv.deleteOne();
      return res.status(200).json({ status: 'success', data: null, message: 'Left group; conversation removed (last participant)' });
    }
    await conv.save();
    res.status(200).json({ status: 'success', data: conv, message: 'Left group' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || 'Failed to leave conversation' });
  }
};

// ---------- Delete message ----------

exports.deleteMessage = async (req, res) => {
  try {
    const actor = req.chatActor;
    const { conversationId, messageId } = req.params;

    const conv = await ChatConversation.findById(conversationId).lean();
    if (!conv) return res.status(404).json({ status: 'fail', message: 'Conversation not found' });
    if (!chatAuthService.canAccessConversation(actor, conv)) return res.status(403).json({ status: 'fail', message: 'Access denied' });

    const msg = await ChatMessage.findOne({ _id: messageId, conversationId });
    if (!msg) return res.status(404).json({ status: 'fail', message: 'Message not found' });
    if (!participantMatch(msg.sender, actor)) return res.status(403).json({ status: 'fail', message: 'Can only delete your own messages' });

    msg.deletedAt = new Date();
    await msg.save();
    res.status(200).json({ status: 'success', data: msg });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || 'Failed to delete message' });
  }
};

// ---------- Upload attachment ----------

exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file && !req.files) return res.status(400).json({ status: 'fail', message: 'No file uploaded' });
    const file = req.file || (Array.isArray(req.files) ? req.files[0] : req.files?.file);
    if (!file || !file.buffer) return res.status(400).json({ status: 'fail', message: 'Invalid file' });

    const conversationId = req.body.conversationId || req.params.conversationId || 'temp';
    const key = `chat-attachments/${conversationId}/${Date.now()}-${(file.originalname || 'file').replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const url = await uploadToR2(key, file.buffer, file.mimetype || 'application/octet-stream');
    res.status(200).json({
      status: 'success',
      data: { url, name: file.originalname || 'file', contentType: file.mimetype || 'application/octet-stream', size: file.size || 0 },
    });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || 'Failed to upload attachment' });
  }
};
