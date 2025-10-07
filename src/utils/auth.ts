import { clearChatCache } from './chatCache';

export const checkSessionExpiration = () => {
  const user = localStorage.getItem('user');
  if (!user) return true;

  try {
    const userData = JSON.parse(user);
    if (!userData.expiracao) return true;

    const expirationDate = new Date(userData.expiracao);
    const currentDate = new Date();

    if (currentDate > expirationDate) {
      clearChatCache();
      localStorage.clear();
      return true;
    }

    return false;
  } catch {
    clearChatCache();
    localStorage.clear();
    return true;
  }
};