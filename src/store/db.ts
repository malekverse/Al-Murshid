import * as SQLite from 'expo-sqlite';

export const getDb = () => {
  return SQLite.openDatabaseSync('almurshid_vault.db');
};
