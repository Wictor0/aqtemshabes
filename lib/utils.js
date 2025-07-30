// Funções utilitárias para a aplicação Aquitemshabes

/**
 * Formata uma data para exibição do Shabat
 * @param {Date} date
 * @returns {string}
 */
export function formatShabbatDate(date) {
  if (!date || !(date instanceof Date)) return "";

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return date.toLocaleDateString("pt-BR", options);
}

/**
 * Obtém a data do próximo Shabat (sexta-feira)
 * @returns {Date}
 */
export function getNextShabbat() {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Domingo, 1 = Segunda, ..., 5 = Sexta
  const daysUntilFriday = (5 - currentDay + 7) % 7;

  const nextFriday = new Date(today);
  nextFriday.setDate(
    today.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday)
  );

  return nextFriday;
}

/**
 * Formata a hora para exibição
 * @param {string} time
 * @returns {string}
 */
export function formatTime(time) {
  if (!time) return "";
  // No React Native, podemos simplesmente retornar a string de tempo
  return time.substring(0, 5);
}

/**
 * Valida o formato do código de convite
 * @param {string} code
 * @returns {boolean}
 */
export function validateInviteCode(code) {
  if (!code || typeof code !== "string") return false;

  // Deve ter 8-12 caracteres, alfanuméricos
  const regex = /^[A-Z0-9]{8,12}$/;
  return regex.test(code.toUpperCase());
}

/**
 * Formata a distância para exibição
 * @param {number} distance
 * @returns {string}
 */
export function formatDistance(distance) {
  if (typeof distance !== "number" || distance < 0) return "";

  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else {
    return `${distance.toFixed(1)}km`;
  }
}

/**
 * Verifica se uma string é um email válido
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
