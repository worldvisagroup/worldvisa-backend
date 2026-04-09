const ZohoDmsUser = require('../models/zohoDmsUser');
const DmsZohoClient = require('../models/dmsZohoClient');

const GROUP_CREATOR_ROLES = ['master_admin', 'supervisor', 'team_leader'];

function normalizeName(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().toLowerCase();
}

function isStaff(actor) {
  return actor && actor.type === 'staff';
}

function isClient(actor) {
  return actor && actor.type === 'client';
}

async function getLeadOwnerForClient(clientId) {
  const client = await DmsZohoClient.findById(clientId).select('lead_owner').lean();
  if (!client || !client.lead_owner) return null;
  const user = await ZohoDmsUser.findOne({ username: client.lead_owner }).select('_id').lean();
  return user ? { type: 'staff', id: user._id } : null;
}


async function staffHandlesClient(staffId, clientId) {
  const [user, client] = await Promise.all([
    ZohoDmsUser.findById(staffId).select('username').lean(),
    DmsZohoClient.findById(clientId).select('lead_owner').lean(),
  ]);
  return (
    !!user &&
    !!client &&
    normalizeName(client.lead_owner) !== '' &&
    normalizeName(client.lead_owner) === normalizeName(user.username)
  );
}

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


function canCreateGroup(actor) {
  if (!actor || actor.type !== 'staff') return false;
  const role = actor.role;
  return role && GROUP_CREATOR_ROLES.includes(role);
}


function canAddToGroup(actor) {
  return canCreateGroup(actor);
}

function canAccessConversation(actor, conversation) {
  if (!actor || !conversation || !conversation.participants) return false;
  const me = conversation.participants.find(
    (p) => p.type === actor.type && p.id.toString() === actor.id.toString()
  );
  return !!me;
}

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
