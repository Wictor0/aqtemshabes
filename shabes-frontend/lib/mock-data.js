// Dados mock para desenvolvimento e teste da aplicação Aquitemshabes

// Tipos que seriam importados de 'types.js'
export const MatchStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  CHAT_REQUESTED: "CHAT_REQUESTED",
};

export const HostResponse = {
  ACCEPT: "ACCEPT",
  DECLINE: "DECLINE",
  REQUEST_CHAT: "REQUEST_CHAT",
};

// Dados de utilizadores mock
export const mockUsers = [
  {
    id: "guilherme-felberg",
    name: "Guilherme Felberg",
    email: "guilherme@aquitemshabes.com",
  },
  {
    id: "user-1",
    name: "Sarah Cohen",
    email: "sarah@example.com",
  },
  {
    id: "user-2",
    name: "David Levy",
    email: "david@example.com",
  },
  {
    id: "user-3",
    name: "Rachel Goldberg",
    email: "rachel@example.com",
  },
];

// Dados de eventos mock (COM OS CAMPOS EM FALTA ADICIONADOS)
export const mockEvents = [
  {
    id: "event-1",
    hostId: "user-2",
    host: mockUsers.find((u) => u.id === "user-2"),
    title: "Shabat Familiar em Jardins",
    description: "Um Shabat caloroso com tradições sefarditas.",
    date: "2025-08-08T19:00:00Z",
    startTime: "19:00:00",
    endTime: "22:30:00",
    maxGuests: 6,
    currentGuests: 2,
    approximateAddress: "Jardins, São Paulo - SP",
    dietary: "Kosher",
    ageGroup: "Famílias",
    language: "Português",
  },
  {
    id: "event-2",
    hostId: "user-1",
    host: mockUsers.find((u) => u.id === "user-1"),
    title: "Shabat para Jovens Profissionais",
    description: "Uma noite especial para networking e conexões.",
    date: "2025-08-08T18:30:00Z",
    startTime: "18:30:00",
    endTime: "23:00:00",
    maxGuests: 8,
    currentGuests: 4,
    approximateAddress: "Higienópolis, São Paulo - SP",
    dietary: "Vegetariano",
    ageGroup: "Jovens",
    language: "Misto",
  },
  {
    id: "event-3",
    hostId: "guilherme-felberg",
    host: mockUsers.find((u) => u.id === "guilherme-felberg"),
    title: "Shabat Tech & Tradição",
    description: "Um encontro sobre tecnologia e tradições judaicas.",
    date: "2025-08-15T19:00:00Z",
    startTime: "19:00:00",
    endTime: "22:00:00",
    maxGuests: 10,
    currentGuests: 3,
    approximateAddress: "Bela Vista, São Paulo - SP",
    dietary: "Kosher",
    ageGroup: "Jovens",
    language: "Português",
  },
  {
    id: "event-4",
    hostId: "user-3",
    host: mockUsers.find((u) => u.id === "user-3"),
    title: "Shabat Gastronómico",
    description: "Um Shabat focado na culinária judaica tradicional.",
    date: "2025-08-15T20:00:00Z",
    startTime: "20:00:00",
    endTime: "23:00:00",
    maxGuests: 5,
    currentGuests: 5,
    approximateAddress: "Liberdade, São Paulo - SP",
    dietary: "Tradicional",
    ageGroup: "Misto",
    language: "Português",
  },
];

// Dados de matches mock
export const mockEventMatches = [
  {
    id: "match-1",
    eventId: "event-1",
    guestId: "guilherme-felberg",
    event: mockEvents.find((e) => e.id === "event-1"),
    guest: mockUsers.find((u) => u.id === "guilherme-felberg"),
    personalMessage:
      "Shalom! Estou muito interessado em participar deste Shabat familiar.",
    matchScore: 0.89,
    status: MatchStatus.PENDING,
    createdAt: "2025-07-28T14:30:00Z",
  },
  {
    id: "match-2",
    eventId: "event-2",
    guestId: "guilherme-felberg",
    event: mockEvents.find((e) => e.id === "event-2"),
    guest: mockUsers.find((u) => u.id === "guilherme-felberg"),
    personalMessage:
      "Olá! Trabalho com tecnologia e adoraria conhecer outros jovens.",
    matchScore: 0.95,
    status: MatchStatus.ACCEPTED,
    createdAt: "2025-07-29T16:15:00Z",
  },
  {
    id: "match-3",
    eventId: "event-3",
    guestId: "user-1",
    event: mockEvents.find((e) => e.id === "event-3"),
    guest: mockUsers.find((u) => u.id === "user-1"),
    personalMessage: "Olá Guilherme, adoraria participar do seu evento!",
    matchScore: 0.92,
    status: MatchStatus.PENDING,
    createdAt: "2025-07-30T10:00:00Z",
  },
  {
    id: "match-4",
    eventId: "event-4",
    guestId: "guilherme-felberg",
    event: mockEvents.find((e) => e.id === "event-4"),
    guest: mockUsers.find((u) => u.id === "guilherme-felberg"),
    personalMessage: "Parece ser uma noite incrível! Adoraria saber mais.",
    matchScore: 0.87,
    status: MatchStatus.CHAT_REQUESTED,
    createdAt: "2025-07-30T11:00:00Z",
  },
];

// Funções de ajuda para os dados mock
export const getUserById = (id) => {
  return mockUsers.find((user) => user.id === id);
};

export const getEventById = (id) => {
  return mockEvents.find((event) => event.id === id);
};

export const getMatchesByGuestId = (guestId) => {
  return mockEventMatches.filter((match) => match.guestId === guestId);
};

export const getRecommendedEvents = (userId) => {
  return mockEvents.filter((event) => event.hostId !== userId);
};
