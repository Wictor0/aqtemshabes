
// Mock data for development and testing of Aquitemshabes application

import { User, Event, EventMatch, Invite, MatchStatus, HostResponse } from './types';

// Mock users data
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Sarah Cohen',
    email: 'sarah@example.com',
    phone: '+55 11 99999-1111',
    isAdmin: false,
    preferences: {
      id: 'pref-1',
      userId: 'user-1',
      maxDistance: 15,
      latitude: -23.5505,
      longitude: -46.6333,
      address: 'Vila Madalena, São Paulo',
      preferredStartTime: '18:30',
      preferredEndTime: '22:00',
      dietary: 'kosher',
      notes: 'Prefiro eventos com famílias jovens'
    },
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'user-2',
    name: 'David Levy',
    email: 'david@example.com',
    phone: '+55 11 99999-2222',
    isAdmin: false,
    preferences: {
      id: 'pref-2',
      userId: 'user-2',
      maxDistance: 10,
      latitude: -23.5629,
      longitude: -46.6544,
      address: 'Jardins, São Paulo',
      preferredStartTime: '19:00',
      preferredEndTime: '23:00',
      dietary: 'traditional',
      notes: 'Gosto de discussões sobre Torah e cultura judaica'
    },
    createdAt: new Date('2024-01-20')
  },
  {
    id: 'user-3',
    name: 'Rachel Goldberg',
    email: 'rachel@example.com',
    phone: '+55 11 99999-3333',
    isAdmin: false,
    preferences: {
      id: 'pref-3',
      userId: 'user-3',
      maxDistance: 20,
      latitude: -23.5312,
      longitude: -46.6741,
      address: 'Higienópolis, São Paulo',
      preferredStartTime: '18:00',
      preferredEndTime: '21:30',
      dietary: 'vegetarian',
      notes: 'Adoro conhecer pessoas novas e compartilhar tradições'
    },
    createdAt: new Date('2024-02-01')
  },
  {
    id: 'admin-user',
    name: 'João Silva',
    email: 'john@doe.com',
    phone: '+55 11 99999-0000',
    isAdmin: true,
    createdAt: new Date('2024-01-01')
  }
];

// Mock events data
export const mockEvents: Event[] = [
  {
    id: 'event-1',
    hostId: 'user-2',
    host: mockUsers[1],
    title: 'Shabat Familiar em Jardins',
    description: 'Um Shabat caloroso com tradições sefarditas, música e histórias para toda a família.',
    date: new Date('2024-07-26'), // Next Friday
    startTime: '19:00',
    endTime: '22:30',
    maxGuests: 6,
    currentGuests: 2,
    approximateAddress: 'Jardins, São Paulo - SP',
    fullAddress: 'Rua Oscar Freire, 1500 - Jardins, São Paulo - SP',
    latitude: -23.5629,
    longitude: -46.6544,
    dietary: 'kosher',
    ageGroup: 'families',
    language: 'portuguese',
    isActive: true,
    isCompleted: false,
    createdAt: new Date('2024-07-15')
  },
  {
    id: 'event-2',
    hostId: 'user-3',
    host: mockUsers[2],
    title: 'Shabat para Jovens Profissionais',
    description: 'Uma noite especial para networking e conexões significativas entre jovens da comunidade.',
    date: new Date('2024-07-26'), // Next Friday
    startTime: '18:30',
    endTime: '23:00',
    maxGuests: 8,
    currentGuests: 4,
    approximateAddress: 'Higienópolis, São Paulo - SP',
    fullAddress: 'Rua da Consolação, 2000 - Higienópolis, São Paulo - SP',
    latitude: -23.5312,
    longitude: -46.6741,
    dietary: 'vegetarian',
    ageGroup: 'young-adults',
    language: 'mixed',
    isActive: true,
    isCompleted: false,
    createdAt: new Date('2024-07-16')
  },
  {
    id: 'event-3',
    hostId: 'user-1',
    host: mockUsers[0],
    title: 'Shabat com Crianças - Vila Madalena',
    description: 'Shabat especialmente pensado para famílias com crianças pequenas, com atividades lúdicas.',
    date: new Date('2024-08-02'), // Following Friday
    startTime: '18:00',
    endTime: '21:00',
    maxGuests: 4,
    currentGuests: 0,
    approximateAddress: 'Vila Madalena, São Paulo - SP',
    fullAddress: 'Rua Harmonia, 800 - Vila Madalena, São Paulo - SP',
    latitude: -23.5505,
    longitude: -46.6333,
    dietary: 'kosher',
    ageGroup: 'families',
    language: 'portuguese',
    isActive: true,
    isCompleted: false,
    createdAt: new Date('2024-07-18')
  }
];

// Mock event matches
export const mockEventMatches: EventMatch[] = [
  {
    id: 'match-1',
    eventId: 'event-1',
    guestId: 'user-1',
    event: mockEvents[0],
    guest: mockUsers[0],
    personalMessage: 'Olá! Estou muito interessada em participar do Shabat. Tenho uma filha pequena e adoramos tradições sefarditas.',
    matchScore: 0.85,
    status: MatchStatus.PENDING,
    createdAt: new Date('2024-07-19T10:30:00')
  },
  {
    id: 'match-2',
    eventId: 'event-2',
    guestId: 'user-1',
    event: mockEvents[1],
    guest: mockUsers[0],
    personalMessage: 'Trabalho em tech e adoraria conhecer outros jovens profissionais da comunidade.',
    matchScore: 0.72,
    status: MatchStatus.CHAT_REQUESTED,
    hostResponse: HostResponse.REQUEST_CHAT,
    createdAt: new Date('2024-07-19T14:15:00'),
    respondedAt: new Date('2024-07-19T16:20:00')
  },
  {
    id: 'match-3',
    eventId: 'event-1',
    guestId: 'user-3',
    event: mockEvents[0],
    guest: mockUsers[2],
    personalMessage: 'Shalom! Seria uma honra participar do Shabat em família. Posso ajudar com algo?',
    matchScore: 0.91,
    status: MatchStatus.ACCEPTED,
    hostResponse: HostResponse.ACCEPT,
    createdAt: new Date('2024-07-18T20:45:00'),
    respondedAt: new Date('2024-07-19T08:10:00'),
    confirmedAt: new Date('2024-07-19T08:10:00')
  }
];

// Mock invite codes
export const mockInvites: Invite[] = [
  {
    id: 'invite-1',
    code: 'SHABBAT2024',
    isUsed: false,
    generatedBy: 'user-2',
    generator: mockUsers[1],
    createdAt: new Date('2024-07-15')
  },
  {
    id: 'invite-2',
    code: 'COMMUNITY2024',
    isUsed: true,
    generatedBy: 'user-3',
    usedBy: 'user-1',
    generator: mockUsers[2],
    createdAt: new Date('2024-01-10'),
    usedAt: new Date('2024-01-15')
  },
  {
    id: 'invite-3',
    code: 'WELCOME2024',
    isUsed: false,
    generatedBy: 'admin-user',
    generator: mockUsers[3],
    createdAt: new Date('2024-07-01')
  }
];

// Helper functions for mock data
export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getEventById = (id: string): Event | undefined => {
  return mockEvents.find(event => event.id === id);
};

export const getEventsByHostId = (hostId: string): Event[] => {
  return mockEvents.filter(event => event.hostId === hostId);
};

export const getMatchesByGuestId = (guestId: string): EventMatch[] => {
  return mockEventMatches.filter(match => match.guestId === guestId);
};

export const getMatchesByEventId = (eventId: string): EventMatch[] => {
  return mockEventMatches.filter(match => match.eventId === eventId);
};

export const validateInviteCode = (code: string): boolean => {
  const invite = mockInvites.find(inv => inv.code === code && !inv.isUsed);
  return !!invite;
};

export const generateInviteCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Calculate distance between two coordinates (in kilometers)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// AI Matchmaking algorithm
export const calculateMatchScore = (
  userPreferences: any,
  event: Event
): number => {
  let score = 0;
  let factors = 0;

  // Distance factor (most important - 40% weight)
  if (userPreferences.latitude && userPreferences.longitude) {
    const distance = calculateDistance(
      userPreferences.latitude,
      userPreferences.longitude,
      event.latitude,
      event.longitude
    );
    const distanceScore = Math.max(0, 1 - (distance / userPreferences.maxDistance));
    score += distanceScore * 0.4;
    factors += 0.4;
  }

  // Time preference factor (30% weight)
  if (userPreferences.preferredStartTime) {
    const userTime = parseInt(userPreferences.preferredStartTime.replace(':', ''));
    const eventTime = parseInt(event.startTime.replace(':', ''));
    const timeDiff = Math.abs(userTime - eventTime);
    const timeScore = Math.max(0, 1 - (timeDiff / 300)); // 3 hours max difference
    score += timeScore * 0.3;
    factors += 0.3;
  }

  // Dietary preference factor (20% weight)
  if (userPreferences.dietary && event.dietary) {
    const dietaryMatch = userPreferences.dietary === event.dietary ? 1 : 0.5;
    score += dietaryMatch * 0.2;
    factors += 0.2;
  }

  // Language preference factor (10% weight)
  if (event.language) {
    const languageScore = event.language === 'mixed' ? 0.8 : 1;
    score += languageScore * 0.1;
    factors += 0.1;
  }

  return factors > 0 ? score / factors : 0;
};
