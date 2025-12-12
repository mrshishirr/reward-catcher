const STORAGE_KEY = 'receiptCatcherConfig';

export const saveConfig = (config: any) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save config to local storage', error);
  }
};

export const loadConfig = () => {
  try {
    const config = localStorage.getItem(STORAGE_KEY);
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error('Failed to load config from local storage', error);
    return null;
  }
};
