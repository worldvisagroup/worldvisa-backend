function escapeString(value) {
  if (typeof value !== 'string') {
    return String(value);
  }
  // Escape single quotes by doubling them (COQL standard)
  return value.replace(/'/g, "''");
}


function sanitizeDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  // Check ISO 8601 date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return null;
  }

  // Validate that it's a valid date
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return null;
  }

  return dateString;
}


function sanitizeUsername(username) {
  if (!username || typeof username !== 'string') {
    return null;
  }

  // Remove potentially dangerous characters, keep alphanumeric, underscore, hyphen, dot
  // Convert to lowercase to match database storage format (usernames are stored as lowercase)
  const sanitized = username.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
  
  // Check minimum length
  if (sanitized.length < 1 || sanitized.length > 100) {
    return null;
  }

  return sanitized;
}


function sanitizeNumber(value, min, max) {
  const num = parseInt(value, 10);
  
  if (isNaN(num)) {
    return null;
  }

  if (num < min || num > max) {
    return null;
  }

  return num;
}


function sanitizeCommaList(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  // Split by comma, trim each value, and sanitize
  const items = value.split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .map(item => escapeString(item));

  if (items.length === 0) {
    return null;
  }

  return items;
}


function sanitizeRole(role) {
  const validRoles = ['admin', 'master_admin', 'user', 'client', 'team_leader', 'supervisor'];
  
  if (!role || typeof role !== 'string') {
    return null;
  }

  const normalizedRole = role.toLowerCase().trim();
  
  if (validRoles.includes(normalizedRole)) {
    return normalizedRole;
  }

  return null;
}


function sanitizeBoolean(value) {
  if (value === true || value === 'true' || value === '1') {
    return true;
  }
  if (value === false || value === 'false' || value === '0') {
    return false;
  }
  return null;
}

module.exports = {
  escapeString,
  sanitizeDate,
  sanitizeUsername,
  sanitizeNumber,
  sanitizeCommaList,
  sanitizeRole,
  sanitizeBoolean
};
