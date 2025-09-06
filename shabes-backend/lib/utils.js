
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Utility functions for Aquitemshabes application

/**
 * Format a date for Shabbat display
 * @param {Date} date 
 * @returns {string}
 */
export function formatShabbatDate(date) {
  if (!date || !(date instanceof Date)) return '';
  
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return date.toLocaleDateString('pt-BR', options);
}

/**
 * Get the next Shabbat date (Friday)
 * @returns {Date}
 */
export function getNextShabbat() {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday
  const daysUntilFriday = (5 - currentDay + 7) % 7;
  
  // If today is Friday, get next Friday
  const nextFriday = new Date(today);
  nextFriday.setDate(today.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
  
  return nextFriday;
}

/**
 * Format time for display
 * @param {string} time 
 * @returns {string}
 */
export function formatTime(time) {
  if (!time) return '';
  return time;
}

/**
 * Calculate age from birth date
 * @param {Date} birthDate 
 * @returns {number}
 */
export function calculateAge(birthDate) {
  if (!birthDate || !(birthDate instanceof Date)) return 0;
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Validate invite code format
 * @param {string} code 
 * @returns {boolean}
 */
export function validateInviteCode(code) {
  if (!code || typeof code !== 'string') return false;
  
  // Should be 8-12 characters, alphanumeric
  const regex = /^[A-Z0-9]{8,12}$/;
  return regex.test(code.toUpperCase());
}

/**
 * Format distance for display
 * @param {number} distance 
 * @returns {string}
 */
export function formatDistance(distance) {
  if (typeof distance !== 'number' || distance < 0) return '';
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else {
    return `${distance.toFixed(1)}km`;
  }
}

/**
 * Get user's geolocation
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

/**
 * Debounce function
 * @param {Function} func 
 * @param {number} wait 
 * @returns {Function}
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate a random ID
 * @param {string} prefix 
 * @returns {string}
 */
export function generateId(prefix = '') {
  const randomPart = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}-${randomPart}` : randomPart;
}

/**
 * Check if a string is a valid email
 * @param {string} email 
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Truncate text to specified length
 * @param {string} text 
 * @param {number} maxLength 
 * @returns {string}
 */
export function truncateText(text, maxLength) {
  if (!text || typeof text !== 'string') return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substr(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter of each word
 * @param {string} str 
 * @returns {string}
 */
export function capitalizeWords(str) {
  if (!str || typeof str !== 'string') return '';
  
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}
