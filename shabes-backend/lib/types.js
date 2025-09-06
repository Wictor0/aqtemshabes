
// Types converted to JSDoc comments for JavaScript
// User types and interfaces

/**
 * @typedef {Object} UserPreferences
 * @property {string} id
 * @property {string} userId
 * @property {number} maxDistance
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} address
 * @property {string} preferredStartTime
 * @property {string} preferredEndTime
 * @property {'kosher'|'traditional'|'vegetarian'|'any'} dietary
 * @property {string} [notes]
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} [phone]
 * @property {boolean} isAdmin
 * @property {UserPreferences} [preferences]
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} Event
 * @property {string} id
 * @property {string} hostId
 * @property {User} host
 * @property {string} title
 * @property {string} description
 * @property {Date} date
 * @property {string} startTime
 * @property {string} endTime
 * @property {number} maxGuests
 * @property {number} currentGuests
 * @property {string} approximateAddress
 * @property {string} fullAddress
 * @property {number} latitude
 * @property {number} longitude
 * @property {'kosher'|'traditional'|'vegetarian'|'any'} dietary
 * @property {'families'|'young-adults'|'seniors'|'mixed'} ageGroup
 * @property {'portuguese'|'hebrew'|'english'|'mixed'} language
 * @property {boolean} isActive
 * @property {boolean} isCompleted
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} EventMatch
 * @property {string} id
 * @property {string} eventId
 * @property {string} guestId
 * @property {Event} event
 * @property {User} guest
 * @property {string} personalMessage
 * @property {number} matchScore
 * @property {'PENDING'|'ACCEPTED'|'DECLINED'|'CHAT_REQUESTED'} status
 * @property {'ACCEPT'|'DECLINE'|'REQUEST_CHAT'} [hostResponse]
 * @property {Date} createdAt
 * @property {Date} [respondedAt]
 * @property {Date} [confirmedAt]
 */

/**
 * @typedef {Object} Invite
 * @property {string} id
 * @property {string} code
 * @property {boolean} isUsed
 * @property {string} generatedBy
 * @property {User} generator
 * @property {string} [usedBy]
 * @property {Date} createdAt
 * @property {Date} [usedAt]
 */

// Export constants for enum-like values
export const MatchStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  CHAT_REQUESTED: 'CHAT_REQUESTED'
};

export const HostResponse = {
  ACCEPT: 'ACCEPT',
  DECLINE: 'DECLINE',
  REQUEST_CHAT: 'REQUEST_CHAT'
};

export const DietaryType = {
  KOSHER: 'kosher',
  TRADITIONAL: 'traditional',
  VEGETARIAN: 'vegetarian',
  ANY: 'any'
};

export const AgeGroup = {
  FAMILIES: 'families',
  YOUNG_ADULTS: 'young-adults',
  SENIORS: 'seniors',
  MIXED: 'mixed'
};

export const Language = {
  PORTUGUESE: 'portuguese',
  HEBREW: 'hebrew',
  ENGLISH: 'english',
  MIXED: 'mixed'
};
