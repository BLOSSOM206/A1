import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_ACCOUNT_KEY = '@A1_auth_account';
const AUTH_SESSION_KEY = '@A1_auth_session';

export type AuthAccount = {
  fullName: string;
  email: string;
  password: string;
  createdAt: number;
};

export type AuthSnapshot = {
  account: AuthAccount | null;
  isSignedIn: boolean;
};

export const AuthStore = {
  async loadSnapshot(): Promise<AuthSnapshot> {
    const [accountText, sessionText] = await Promise.all([
      AsyncStorage.getItem(AUTH_ACCOUNT_KEY),
      AsyncStorage.getItem(AUTH_SESSION_KEY),
    ]);

    return {
      account: accountText ? (JSON.parse(accountText) as AuthAccount) : null,
      isSignedIn: sessionText === 'true',
    };
  },

  async signUp(account: Omit<AuthAccount, 'createdAt'>): Promise<AuthAccount> {
    const nextAccount: AuthAccount = {
      ...account,
      createdAt: Date.now(),
    };

    await AsyncStorage.setItem(AUTH_ACCOUNT_KEY, JSON.stringify(nextAccount));
    await AsyncStorage.setItem(AUTH_SESSION_KEY, 'true');

    return nextAccount;
  },

  async signIn(email: string, password: string): Promise<AuthAccount> {
    const snapshot = await this.loadSnapshot();

    if (!snapshot.account) {
      throw new Error('No account found. Please sign up first.');
    }

    if (snapshot.account.email.toLowerCase() !== email.trim().toLowerCase()) {
      throw new Error('Email does not match the saved account.');
    }

    if (snapshot.account.password !== password) {
      throw new Error('Incorrect password.');
    }

    await AsyncStorage.setItem(AUTH_SESSION_KEY, 'true');
    return snapshot.account;
  },

  async signOut(): Promise<void> {
    await AsyncStorage.setItem(AUTH_SESSION_KEY, 'false');
  },

  async clearAccount(): Promise<void> {
    await AsyncStorage.multiRemove([AUTH_ACCOUNT_KEY, AUTH_SESSION_KEY]);
  },
};