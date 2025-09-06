
// Mock data for development and testing of Aquitemshabes application

import { MatchStatus, HostResponse } from './types.js';

// Mock users data with enhanced data including Guilherme Felberg
export const mockUsers = [
  {
    id: 'guilherme-felberg',
    name: 'Guilherme Felberg',
    email: 'guilherme@aquitemshabes.com',
    phone: '+55 11 99888-7777',
    isAdmin: false,
    preferences: {
      id: 'pref-guilherme',
      userId: 'guilherme-felberg',
      maxDistance: 25,
      latitude: -23.5489,
      longitude: -46.6388,
      address: 'Bela Vista, São Paulo',
      preferredStartTime: '19:00',
      preferredEndTime: '22:30',
      dietary: 'kosher',
      notes: 'Apaixonado por tecnologia e tradições judaicas. Adoro conhecer pessoas novas!'
    },
    createdAt: new Date('2024-07-01')
  },
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
    id: 'user-4',
    name: 'Daniel Rosenberg',
    email: 'daniel@example.com',
    phone: '+55 11 99999-4444',
    isAdmin: false,
    preferences: {
      id: 'pref-4',
      userId: 'user-4',
      maxDistance: 30,
      latitude: -23.5420,
      longitude: -46.6444,
      address: 'Liberdade, São Paulo',
      preferredStartTime: '18:30',
      preferredEndTime: '22:00',
      dietary: 'kosher',
      notes: 'Chef amador, adoro cozinhar pratos tradicionais'
    },
    createdAt: new Date('2024-02-15')
  },
  {
    id: 'user-5',
    name: 'Miriam Santos',
    email: 'miriam@example.com',
    phone: '+55 11 99999-5555',
    isAdmin: false,
    preferences: {
      id: 'pref-5',
      userId: 'user-5',
      maxDistance: 18,
      latitude: -23.5733,
      longitude: -46.6417,
      address: 'Itaim Bibi, São Paulo',
      preferredStartTime: '19:30',
      preferredEndTime: '23:30',
      dietary: 'traditional',
      notes: 'Professora de hebraico, amo ensinar sobre nossa cultura'
    },
    createdAt: new Date('2024-03-01')
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

// Enhanced mock events data with more comprehensive options
export const mockEvents = [
  {
    id: 'event-1',
    hostId: 'user-2',
    host: mockUsers.find(u => u.id === 'user-2'),
    title: 'Shabat Familiar em Jardins',
    description: 'Um Shabat caloroso com tradições sefarditas, música e histórias para toda a família. Teremos canções tradicionais e uma mesa farta com pratos típicos.',
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
    host: mockUsers.find(u => u.id === 'user-3'),
    title: 'Shabat para Jovens Profissionais',
    description: 'Uma noite especial para networking e conexões significativas entre jovens da comunidade. Ambiente descontraído com discussões interessantes.',
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
    host: mockUsers.find(u => u.id === 'user-1'),
    title: 'Shabat com Crianças - Vila Madalena',
    description: 'Shabat especialmente pensado para famílias com crianças pequenas, com atividades lúdicas e histórias bíblicas adaptadas para os pequenos.',
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
  },
  {
    id: 'event-4',
    hostId: 'user-4',
    host: mockUsers.find(u => u.id === 'user-4'),
    title: 'Shabat Gastronômico - Liberdade',
    description: 'Um Shabat especial focado na culinária judaica tradicional. O anfitrião é chef e preparará pratos autênticos da nossa tradição.',
    date: new Date('2024-08-02'), // Following Friday
    startTime: '19:30',
    endTime: '23:00',
    maxGuests: 6,
    currentGuests: 1,
    approximateAddress: 'Liberdade, São Paulo - SP',
    fullAddress: 'Rua da Glória, 300 - Liberdade, São Paulo - SP',
    latitude: -23.5420,
    longitude: -46.6444,
    dietary: 'kosher',
    ageGroup: 'mixed',
    language: 'portuguese',
    isActive: true,
    isCompleted: false,
    createdAt: new Date('2024-07-17')
  },
  {
    id: 'event-5',
    hostId: 'user-5',
    host: mockUsers.find(u => u.id === 'user-5'),
    title: 'Shabat com Aula de Hebraico - Itaim',
    description: 'Combine Shabat com aprendizado! Teremos uma breve aula de hebraico antes do jantar, perfeita para iniciantes.',
    date: new Date('2024-08-09'), // Week after
    startTime: '19:00',
    endTime: '22:30',
    maxGuests: 5,
    currentGuests: 2,
    approximateAddress: 'Itaim Bibi, São Paulo - SP',
    fullAddress: 'Rua Pedroso Alvarenga, 1000 - Itaim Bibi, São Paulo - SP',
    latitude: -23.5733,
    longitude: -46.6417,
    dietary: 'traditional',
    ageGroup: 'young-adults',
    language: 'mixed',
    isActive: true,
    isCompleted: false,
    createdAt: new Date('2024-07-19')
  },
  {
    id: 'event-6',
    hostId: 'guilherme-felberg',
    host: mockUsers.find(u => u.id === 'guilherme-felberg'),
    title: 'Shabat Tech & Tradição - Bela Vista',
    description: 'Um encontro único onde conversaremos sobre como a tecnologia pode enriquecer nossas tradições judaicas. Ideal para profissionais de tech!',
    date: new Date('2024-08-09'), // Week after
    startTime: '19:00',
    endTime: '22:00',
    maxGuests: 8,
    currentGuests: 0,
    approximateAddress: 'Bela Vista, São Paulo - SP',
    fullAddress: 'Rua Augusta, 1200 - Bela Vista, São Paulo - SP',
    latitude: -23.5489,
    longitude: -46.6388,
    dietary: 'kosher',
    ageGroup: 'young-adults',
    language: 'portuguese',
    isActive: true,
    isCompleted: false,
    createdAt: new Date('2024-07-20')
  }
];

// Enhanced mock event matches with more comprehensive scenarios
export const mockEventMatches = [
  {
    id: 'match-1',
    eventId: 'event-1',
    guestId: 'guilherme-felberg',
    event: mockEvents.find(e => e.id === 'event-1'),
    guest: mockUsers.find(u => u.id === 'guilherme-felberg'),
    personalMessage: 'Shalom! Estou muito interessado em participar deste Shabat familiar. Adoro tradições sefarditas e seria uma honra conhecer sua família.',
    matchScore: 0.89,
    status: MatchStatus.PENDING,
    createdAt: new Date('2024-07-19T14:30:00')
  },
  {
    id: 'match-2',
    eventId: 'event-2',
    guestId: 'guilherme-felberg',
    event: mockEvents.find(e => e.id === 'event-2'),
    guest: mockUsers.find(u => u.id === 'guilherme-felberg'),
    personalMessage: 'Olá! Trabalho com tecnologia e adoraria conhecer outros jovens profissionais da nossa comunidade. Parece ser uma noite incrível!',
    matchScore: 0.95,
    status: MatchStatus.CHAT_REQUESTED,
    hostResponse: HostResponse.REQUEST_CHAT,
    createdAt: new Date('2024-07-19T16:15:00'),
    respondedAt: new Date('2024-07-19T18:20:00')
  },
  {
    id: 'match-3',
    eventId: 'event-4',
    guestId: 'guilherme-felberg',
    event: mockEvents.find(e => e.id === 'event-4'),
    guest: mockUsers.find(u => u.id === 'guilherme-felberg'),
    personalMessage: 'Que oportunidade incrível! Sou apaixonado por culinária judaica e adoraria aprender com um chef. Posso ajudar com alguma coisa?',
    matchScore: 0.87,
    status: MatchStatus.ACCEPTED,
    hostResponse: HostResponse.ACCEPT,
    createdAt: new Date('2024-07-18T20:45:00'),
    respondedAt: new Date('2024-07-19T08:10:00'),
    confirmedAt: new Date('2024-07-19T08:10:00')
  },
  {
    id: 'match-4',
    eventId: 'event-1',
    guestId: 'user-1',
    event: mockEvents.find(e => e.id === 'event-1'),
    guest: mockUsers.find(u => u.id === 'user-1'),
    personalMessage: 'Olá! Estou muito interessada em participar do Shabat. Tenho uma filha pequena e adoramos tradições sefarditas.',
    matchScore: 0.85,
    status: MatchStatus.PENDING,
    createdAt: new Date('2024-07-19T10:30:00')
  },
  {
    id: 'match-5',
    eventId: 'event-2',
    guestId: 'user-1',
    event: mockEvents.find(e => e.id === 'event-2'),
    guest: mockUsers.find(u => u.id === 'user-1'),
    personalMessage: 'Trabalho em tech e adoraria conhecer outros jovens profissionais da comunidade.',
    matchScore: 0.72,
    status: MatchStatus.DECLINED,
    hostResponse: HostResponse.DECLINE,
    createdAt: new Date('2024-07-19T14:15:00'),
    respondedAt: new Date('2024-07-19T16:20:00')
  },
  {
    id: 'match-6',
    eventId: 'event-1',
    guestId: 'user-3',
    event: mockEvents.find(e => e.id === 'event-1'),
    guest: mockUsers.find(u => u.id === 'user-3'),
    personalMessage: 'Shalom! Seria uma honra participar do Shabat em família. Posso ajudar com algo?',
    matchScore: 0.91,
    status: MatchStatus.ACCEPTED,
    hostResponse: HostResponse.ACCEPT,
    createdAt: new Date('2024-07-18T20:45:00'),
    respondedAt: new Date('2024-07-19T08:10:00'),
    confirmedAt: new Date('2024-07-19T08:10:00')
  },
  {
    id: 'match-7',
    eventId: 'event-6',
    guestId: 'user-2',
    event: mockEvents.find(e => e.id === 'event-6'),
    guest: mockUsers.find(u => u.id === 'user-2'),
    personalMessage: 'Interessante proposta! Como alguém mais tradicional, adoraria conhecer essa perspectiva moderna.',
    matchScore: 0.78,
    status: MatchStatus.PENDING,
    createdAt: new Date('2024-07-20T11:00:00')
  },
  {
    id: 'match-8',
    eventId: 'event-5',
    guestId: 'user-4',
    event: mockEvents.find(e => e.id === 'event-5'),
    guest: mockUsers.find(u => u.id === 'user-4'),
    personalMessage: 'Adoro a ideia de aprender hebraico! Mesmo sendo chef, sempre quis melhorar meu hebraico.',
    matchScore: 0.82,
    status: MatchStatus.CHAT_REQUESTED,
    hostResponse: HostResponse.REQUEST_CHAT,
    createdAt: new Date('2024-07-19T19:30:00'),
    respondedAt: new Date('2024-07-20T09:15:00')
  }
];

// Enhanced mock invite codes including SHALOM2025
export const mockInvites = [
  {
    id: 'invite-shalom2025',
    code: 'SHALOM2025',
    isUsed: false,
    generatedBy: 'admin-user',
    generator: mockUsers.find(u => u.id === 'admin-user'),
    createdAt: new Date('2024-07-01')
  },
  {
    id: 'invite-1',
    code: 'SHABBAT2024',
    isUsed: false,
    generatedBy: 'user-2',
    generator: mockUsers.find(u => u.id === 'user-2'),
    createdAt: new Date('2024-07-15')
  },
  {
    id: 'invite-2',
    code: 'COMMUNITY2024',
    isUsed: true,
    generatedBy: 'user-3',
    usedBy: 'user-1',
    generator: mockUsers.find(u => u.id === 'user-3'),
    createdAt: new Date('2024-01-10'),
    usedAt: new Date('2024-01-15')
  },
  {
    id: 'invite-3',
    code: 'WELCOME2024',
    isUsed: false,
    generatedBy: 'admin-user',
    generator: mockUsers.find(u => u.id === 'admin-user'),
    createdAt: new Date('2024-07-01')
  },
  {
    id: 'invite-4',
    code: 'TECH2024',
    isUsed: false,
    generatedBy: 'guilherme-felberg',
    generator: mockUsers.find(u => u.id === 'guilherme-felberg'),
    createdAt: new Date('2024-07-10')
  }
];

// Helper functions for mock data
export const getUserById = (id) => {
  return mockUsers.find(user => user.id === id);
};

export const getEventById = (id) => {
  return mockEvents.find(event => event.id === id);
};

export const getEventsByHostId = (hostId) => {
  return mockEvents.filter(event => event.hostId === hostId);
};

export const getMatchesByGuestId = (guestId) => {
  return mockEventMatches.filter(match => match.guestId === guestId);
};

export const getMatchesByEventId = (eventId) => {
  return mockEventMatches.filter(match => match.eventId === eventId);
};

export const validateInviteCode = (code) => {
  const invite = mockInvites.find(inv => inv.code === code && !inv.isUsed);
  return !!invite;
};

export const generateInviteCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Calculate distance between two coordinates (in kilometers)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Enhanced AI Matchmaking algorithm
export const calculateMatchScore = (userPreferences, event) => {
  let score = 0;
  let factors = 0;

  // Distance factor (most important - 40% weight)
  if (userPreferences?.latitude && userPreferences?.longitude) {
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
  if (userPreferences?.preferredStartTime) {
    const userTime = parseInt(userPreferences.preferredStartTime.replace(':', ''));
    const eventTime = parseInt(event.startTime.replace(':', ''));
    const timeDiff = Math.abs(userTime - eventTime);
    const timeScore = Math.max(0, 1 - (timeDiff / 300)); // 3 hours max difference
    score += timeScore * 0.3;
    factors += 0.3;
  }

  // Dietary preference factor (20% weight)
  if (userPreferences?.dietary && event.dietary) {
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

// Get recommended events for a user
export const getRecommendedEvents = (userId) => {
  const user = getUserById(userId);
  if (!user?.preferences) return [];
  
  // Filter active upcoming events
  const upcomingEvents = mockEvents.filter(event => 
    event.isActive && 
    new Date(event.date) >= new Date() &&
    event.hostId !== userId &&
    event.currentGuests < event.maxGuests
  );
  
  // Calculate match scores and sort
  const scoredEvents = upcomingEvents.map(event => ({
    ...event,
    matchScore: calculateMatchScore(user.preferences, event),
    distance: calculateDistance(
      user.preferences.latitude,
      user.preferences.longitude,
      event.latitude,
      event.longitude
    )
  }));
  
  // Sort by match score (highest first) and then by distance
  return scoredEvents.sort((a, b) => {
    if (Math.abs(a.matchScore - b.matchScore) < 0.1) {
      return a.distance - b.distance;
    }
    return b.matchScore - a.matchScore;
  });
};
