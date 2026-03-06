const ZohoDmsUser = require('../models/zohoDmsUser');
const DmsZohoClient = require('../models/dmsZohoClient');

const GROUP_CREATOR_ROLES = ['master_admin', 'supervisor', 'team_leader'];

function isStaff(actor) {
  return actor && actor.type === 'staff';
}

function isClient(actor) {
  return actor && actor.type === 'client';
}

/**
 * Resolve lead owner (staff) for a client. Returns { type: 'staff', id } or null.
 */
async function getLeadOwnerForClient(clientId) {
  const client = await DmsZohoClient.findById(clientId).select('lead_owner').lean();
  if (!client || !client.lead_owner) return null;
  const user = await ZohoDmsUser.findOne({ username: client.lead_owner }).select('_id').lean();
  return user ? { type: 'staff', id: user._id } : null;
}

/**
 * Check if staff (by username) "handles" the given client (client's lead_owner === staff username).
 */
async function staffHandlesClient(staffId, clientId) {
  const [user, client] = await Promise.all([
    ZohoDmsUser.findById(staffId).select('username').lean(),
    DmsZohoClient.findById(clientId).select('lead_owner').lean(),
  ]);
  return user && client && client.lead_owner === user.username;
}

/**
 * Can actor initiate a DM with the other participant?
 * - Client: only with their lead_owner.
 * - Admin: any staff; clients only if staffHandlesClient(actor.id, other.id).
 * - master_admin / supervisor / team_leader: any staff; any client (can create chat with any client).
 */
async function canInitiateDm(actor, otherParticipant) {
  if (!actor || !otherParticipant) return false;
  if (otherParticipant.type !== 'client' && otherParticipant.type !== 'staff') return false;

  if (isClient(actor)) {
    if (otherParticipant.type !== 'staff') return false;
    const leadOwner = await getLeadOwnerForClient(actor.id);
    return leadOwner && leadOwner.id.toString() === otherParticipant.id.toString();
  }

  if (isStaff(actor)) {
    if (otherParticipant.type === 'staff') return true;
    if (otherParticipant.type === 'client') {
      const role = actor.role;
      if (role && GROUP_CREATOR_ROLES.includes(role)) return true;
      return staffHandlesClient(actor.id, otherParticipant.id);
    }
  }

  return false;
}

/**
 * Only master_admin, supervisor, team_leader can create groups.
 * actor must have .role (use withRole(req.chatActor, req.user) when calling).
 */
function canCreateGroup(actor) {
  if (!actor || actor.type !== 'staff') return false;
  const role = actor.role;
  return role && GROUP_CREATOR_ROLES.includes(role);
}

/**
 * Same as canCreateGroup for who can add/remove group participants.
 */
function canAddToGroup(actor) {
  return canCreateGroup(actor);
}

/**
 * Can actor access this conversation? (Is they a participant?)
 */
function canAccessConversation(actor, conversation) {
  if (!actor || !conversation || !conversation.participants) return false;
  const me = conversation.participants.find(
    (p) => p.type === actor.type && p.id.toString() === actor.id.toString()
  );
  return !!me;
}

/**
 * Attach role to staff actor for canCreateGroup/canAddToGroup. Call after loading user.
 */
function withRole(actor, user) {
  if (!actor || actor.type !== 'staff' || !user) return actor;
  return { ...actor, role: user.role };
}

module.exports = {
  getLeadOwnerForClient,
  staffHandlesClient,
  canInitiateDm,
  canCreateGroup,
  canAddToGroup,
  canAccessConversation,
  withRole,
  GROUP_CREATOR_ROLES,
};
