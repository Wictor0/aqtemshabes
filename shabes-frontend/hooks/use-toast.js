import Toast from "react-native-toast-message";

/*
  TRADUÇÃO DE CONCEITOS:
  - O sistema complexo de reducer, listeners e timeouts foi substituído pela biblioteca `react-native-toast-message`, que gerencia tudo internamente.
  - Criamos uma função 'toast' que serve como um "adaptador", convertendo um objeto de opções simples em uma chamada para a biblioteca.
  - Isso mantém a forma de uso parecida com a original (`toast({ title: '...' })`), mas com a robustez de uma biblioteca nativa.
*/

/**
 * Mostra uma notificação (toast) na tela.
 * @param {object} options - As opções do toast.
 * @param {'success' | 'error' | 'info'} [options.type='info'] - O tipo de toast.
 * @param {string} options.title - O título principal do toast.
 * @param {string} [options.description] - O texto secundário do toast.
 */
export const toast = ({ type = "info", title, description }) => {
  Toast.show({
    type: type, // 'success', 'error', 'info'
    text1: title,
    text2: description,
    visibilityTime: 4000, // 4 segundos
    position: "top",
  });
};

// Mantemos o hook 'useToast' para consistência, embora ele apenas retorne a função 'toast'.
export function useToast() {
  return {
    toast,
  };
}
