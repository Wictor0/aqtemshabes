
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date and time utilities for Shabbat events
export const formatShabbatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (time: string): string => {
  return time;
};

export const isShabbatTime = (): boolean => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = now.getHours();
  
  // Friday evening (after 18:00) to Saturday evening (before 22:00)
  return (dayOfWeek === 5 && hours >= 18) || (dayOfWeek === 6 && hours < 22);
};

export const getNextShabbat = (): Date => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + daysUntilFriday);
  return nextFriday;
};

// WhatsApp integration
export const generateWhatsAppLink = (phone: string, message?: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${cleanPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
};

// Google Calendar integration
export const generateCalendarEvent = (event: any): string => {
  const startDate = new Date(event.date);
  const [startHour, startMinute] = event.startTime.split(':');
  startDate.setHours(parseInt(startHour), parseInt(startMinute));
  
  const endDate = new Date(startDate);
  if (event.endTime) {
    const [endHour, endMinute] = event.endTime.split(':');
    endDate.setHours(parseInt(endHour), parseInt(endMinute));
  } else {
    endDate.setHours(startDate.getHours() + 3); // Default 3 hours
  }

  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: event.description || 'Evento do Aquitemshabes - Shabat comunitário',
    location: event.fullAddress,
    sf: 'true',
    output: 'xml'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// Distance calculation utilities
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  const cleanPhone = phone.replace(/\D/g, '');
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
};

export const validateInviteCode = (code: string): boolean => {
  return /^[A-Z0-9]{6,12}$/.test(code);
};

// Status and response utilities
export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: 'Aguardando resposta',
    ACCEPTED: 'Aceito',
    DECLINED: 'Recusado',
    CHAT_REQUESTED: 'Chat solicitado',
    CONFIRMED: 'Confirmado',
    CANCELLED: 'Cancelado'
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    PENDING: 'text-yellow-600 bg-yellow-50',
    ACCEPTED: 'text-green-600 bg-green-50',
    DECLINED: 'text-red-600 bg-red-50',
    CHAT_REQUESTED: 'text-blue-600 bg-blue-50',
    CONFIRMED: 'text-green-700 bg-green-100',
    CANCELLED: 'text-gray-600 bg-gray-50'
  };
  return colorMap[status] || 'text-gray-600 bg-gray-50';
};

// Number formatting
export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

// Text utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Array utilities
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Invite code generation
export const generateInviteCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Safe operations to prevent crashes
export const safeParseInt = (value: string | undefined, defaultValue: number = 0): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const safeParseFloat = (value: string | undefined, defaultValue: number = 0): number => {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const safeStringOperation = (str: string | undefined, operation: (s: string) => string): string => {
  return str ? operation(str) : '';
};
