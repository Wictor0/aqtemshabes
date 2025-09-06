
// Type definitions for Aquitemshabes application

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isAdmin: boolean;
  preferences?: UserPreferences;
  createdAt: Date;
}

export interface UserPreferences {
  id: string;
  userId: string;
  maxDistance: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  preferredStartTime?: string;
  preferredEndTime?: string;
  dietary?: string;
  notes?: string;
}

export interface Event {
  id: string;
  hostId: string;
  host: User;
  title: string;
  description?: string;
  date: Date;
  startTime: string;
  endTime?: string;
  maxGuests: number;
  currentGuests: number;
  approximateAddress: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  dietary?: string;
  ageGroup?: string;
  language?: string;
  isActive: boolean;
  isCompleted: boolean;
  matches?: EventMatch[];
  createdAt: Date;
}

export interface EventMatch {
  id: string;
  eventId: string;
  guestId: string;
  event: Event;
  guest: User;
  personalMessage?: string;
  matchScore: number;
  status: MatchStatus;
  hostResponse?: HostResponse;
  createdAt: Date;
  respondedAt?: Date;
  confirmedAt?: Date;
}

export interface Invite {
  id: string;
  code: string;
  isUsed: boolean;
  generatedBy: string;
  usedBy?: string;
  generator: User;
  createdAt: Date;
  usedAt?: Date;
}

export interface Feedback {
  id: string;
  eventId: string;
  giverId: string;
  receiverId: string;
  rating: number;
  comment?: string;
  tags?: string;
  isAnonymous: boolean;
  createdAt: Date;
}

export enum MatchStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  CHAT_REQUESTED = 'CHAT_REQUESTED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

export enum HostResponse {
  ACCEPT = 'ACCEPT',
  DECLINE = 'DECLINE',
  REQUEST_CHAT = 'REQUEST_CHAT'
}

// Form types
export interface SignUpFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  inviteCode: string;
}

export interface CreateEventFormData {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime?: string;
  maxGuests: number;
  fullAddress: string;
  dietary?: string;
  ageGroup?: string;
  language?: string;
}

export interface PreferencesFormData {
  maxDistance: number;
  address?: string;
  preferredStartTime?: string;
  preferredEndTime?: string;
  dietary?: string;
  notes?: string;
}

export interface FeedbackFormData {
  rating: number;
  comment?: string;
  tags: string[];
  isAnonymous: boolean;
}

// Component props types
export interface EventCardProps {
  event: Event;
  onInterest?: (eventId: string) => void;
  showDistance?: boolean;
  distance?: number;
}

export interface MatchCardProps {
  match: EventMatch;
  onAccept?: (matchId: string) => void;
  onDecline?: (matchId: string) => void;
  onRequestChat?: (matchId: string) => void;
  isHost?: boolean;
}

export interface FeedbackCardProps {
  feedback: Feedback;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Location and AI matching types
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface MatchingCriteria {
  location: LocationCoordinates;
  maxDistance: number;
  preferredStartTime?: string;
  preferredEndTime?: string;
  dietary?: string;
}

export interface MatchResult {
  eventId: string;
  score: number;
  reasons: string[];
  distance: number;
}
