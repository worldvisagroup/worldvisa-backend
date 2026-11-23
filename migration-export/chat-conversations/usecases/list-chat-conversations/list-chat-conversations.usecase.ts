import type { FilterQuery, Model } from 'mongoose';
import type { ChatConversationResponseDto } from '../../dtos/chat-conversation-response.dto';
import {
  CHAT_CONVERSATION_COLUMNS,
  mapChatConversationToDto,
  type ChatConversationRow,
} from './map-chat-conversation-to-dto';
import { toSkip, type Page } from '../../../shared/paging';
import type { ListChatConversationsCommand } from './list-chat-conversations.command';

const ChatConversation = require('../../../../models/chatConversation');
const DmsZohoClient = require('../../../../models/dmsZohoClient');

interface ClientLeadRow {
  _id: { toString(): string };
  lead_id?: string | null;
}

export interface ChatConversationModels {
  conversations: Pick<Model<ChatConversationRow>, 'find' | 'countDocuments'>;
  clients: Pick<Model<ClientLeadRow>, 'find'>;
}

/** Direct messages only, with exactly two participants (decision D25); the chat messages endpoint reuses it. */
export const DIRECT_CONVERSATION_FILTER = { type: 'dm', participants: { $size: 2 } };

export const buildChatConversationFilter = ({ from, to }: ListChatConversationsCommand): FilterQuery<ChatConversationRow> => {
  const filter: FilterQuery<ChatConversationRow> = { ...DIRECT_CONVERSATION_FILTER };
  if (from || to) {
    filter.createdAt = { ...(from && { $gte: from }), ...(to && { $lt: to }) };
  }
  return filter;
};

const findLeadIdsByClientId = async (
  clients: ChatConversationModels['clients'],
  rows: ChatConversationRow[]
): Promise<Map<string, string>> => {
  const clientIds = rows.flatMap(({ participants }) => participants.filter(({ type }) => type === 'client').map(({ id }) => id));
  if (clientIds.length === 0) {
    return new Map();
  }

  const found = await clients
    .find({ _id: { $in: clientIds } })
    .select('lead_id')
    .lean<ClientLeadRow[]>();
  return new Map(found.flatMap(({ _id, lead_id }) => (lead_id ? [[_id.toString(), lead_id] as const] : [])));
};

export const listChatConversations = async (
  command: ListChatConversationsCommand,
  { conversations, clients }: ChatConversationModels = { conversations: ChatConversation, clients: DmsZohoClient }
): Promise<Page<ChatConversationResponseDto>> => {
  const filter = buildChatConversationFilter(command);
  const { page, limit } = command;

  const [rows, total] = await Promise.all([
    conversations
      .find(filter)
      .select(CHAT_CONVERSATION_COLUMNS.join(' '))
      .sort({ createdAt: 1, _id: 1 })
      .skip(toSkip(command))
      .limit(limit)
      .allowDiskUse(true)
      .lean<ChatConversationRow[]>(),
    conversations.countDocuments(filter),
  ]);

  const leadIdByClientId = await findLeadIdsByClientId(clients, rows);
  return { data: rows.map((row) => mapChatConversationToDto(row, leadIdByClientId)), total, page, limit };
};
