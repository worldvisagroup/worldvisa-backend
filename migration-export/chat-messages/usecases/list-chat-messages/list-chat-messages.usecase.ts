import type { FilterQuery, Model } from 'mongoose';
import { DIRECT_CONVERSATION_FILTER } from '../../../chat-conversations/usecases/list-chat-conversations/list-chat-conversations.usecase';
import type { ChatMessageResponseDto } from '../../dtos/chat-message-response.dto';
import { CHAT_MESSAGE_COLUMNS, mapChatMessageToDto, type ChatMessageRow } from './map-chat-message-to-dto';
import { toSkip, type Page } from '../../../shared/paging';
import type { ListChatMessagesCommand } from './list-chat-messages.command';

const ChatConversation = require('../../../../models/chatConversation');
const ChatMessage = require('../../../../models/chatMessage');

interface ConversationIdRow {
  _id: { toString(): string };
}

export interface ChatMessageModels {
  conversations: Pick<Model<ConversationIdRow>, 'find'>;
  messages: Pick<Model<ChatMessageRow>, 'find' | 'countDocuments'>;
}

/**
 * Messages of direct-message conversations only (decision D25), never deleted ones.
 * `directConversationIds` are the conversations the DM rule accepts; an unknown or non-DM `conversationId` matches nothing.
 */
export const buildChatMessageFilter = (
  { conversationId, from, to }: ListChatMessagesCommand,
  directConversationIds: ConversationIdRow['_id'][]
): FilterQuery<ChatMessageRow> => {
  const visibleIds = conversationId ? directConversationIds.filter((id) => id.toString() === conversationId.toLowerCase()) : directConversationIds;
  const filter: FilterQuery<ChatMessageRow> = { conversationId: { $in: visibleIds }, deletedAt: null };
  if (from || to) {
    filter.createdAt = { ...(from && { $gte: from }), ...(to && { $lt: to }) };
  }
  return filter;
};

export const listChatMessages = async (
  command: ListChatMessagesCommand,
  fileBaseUrl: string,
  { conversations, messages }: ChatMessageModels = { conversations: ChatConversation, messages: ChatMessage }
): Promise<Page<ChatMessageResponseDto>> => {
  const directConversations = await conversations.find(DIRECT_CONVERSATION_FILTER).select('_id').lean<ConversationIdRow[]>();
  const filter = buildChatMessageFilter(command, directConversations.map(({ _id }) => _id));
  const { page, limit } = command;

  const [rows, total] = await Promise.all([
    messages
      .find(filter)
      .select(CHAT_MESSAGE_COLUMNS.join(' '))
      .sort({ createdAt: 1, _id: 1 })
      .skip(toSkip(command))
      .limit(limit)
      .allowDiskUse(true)
      .lean<ChatMessageRow[]>(),
    messages.countDocuments(filter),
  ]);

  return { data: rows.map((row) => mapChatMessageToDto(fileBaseUrl, row)), total, page, limit };
};
