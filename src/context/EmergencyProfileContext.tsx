/**
 * Emergency Profile Context
 * Manages emergency profile state across app
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { EmergencyProfile, EmergencyContact } from '../types/Emergency';
import { EmergencyProfileStore } from '../services/emergency/emergencyProfileStore';

interface EmergencyProfileContextValue {
  profile: EmergencyProfile | null;
  contacts: EmergencyContact[];
  isLoading: boolean;
  error: string | null;

  // Profile mutations
  setProfile: (profile: EmergencyProfile) => Promise<void>;
  updateProfile: (updates: Partial<EmergencyProfile>) => Promise<void>;

  // Contact mutations
  addContact: (contact: EmergencyContact) => Promise<void>;
  updateContact: (contact: EmergencyContact) => Promise<void>;
  removeContact: (contactId: string) => Promise<void>;

  // Utility
  refresh: () => Promise<void>;
  isProfileComplete: () => boolean;
}

export const EmergencyProfileContext = createContext<
  EmergencyProfileContextValue | undefined
>(undefined);

export const EmergencyProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [profile, setProfileState] = useState<EmergencyProfile | null>(null);
  const [contacts, setContactsState] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load profile and contacts on mount
   */
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [loadedProfile, loadedContacts] = await Promise.all([
        EmergencyProfileStore.loadProfileLocal(),
        EmergencyProfileStore.loadContactsLocal(),
      ]);

      setProfileState(loadedProfile);
      setContactsState(loadedContacts);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load emergency profile';
      setError(message);
      console.error('Error loading emergency data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const setProfile = async (newProfile: EmergencyProfile) => {
    try {
      setError(null);
      await EmergencyProfileStore.saveProfileLocal(newProfile);
      setProfileState(newProfile);
      if (newProfile.emergencyContacts) {
        setContactsState([...newProfile.emergencyContacts].sort((a, b) => a.priority - b.priority));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      setError(message);
      throw err;
    }
  };

  const updateProfile = async (updates: Partial<EmergencyProfile>) => {
    if (!profile) {
      throw new Error('No existing profile to update');
    }

    try {
      setError(null);
      const updated = { ...profile, ...updates };
      await EmergencyProfileStore.saveProfileLocal(updated);
      setProfileState(updated);
      if (updated.emergencyContacts) {
        setContactsState([...updated.emergencyContacts].sort((a, b) => a.priority - b.priority));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      throw err;
    }
  };

  const addContact = async (contact: EmergencyContact) => {
    try {
      setError(null);
      await EmergencyProfileStore.addContact(contact);
      const updated = await EmergencyProfileStore.loadContactsLocal();
      setContactsState(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add contact';
      setError(message);
      throw err;
    }
  };

  const updateContact = async (contact: EmergencyContact) => {
    try {
      setError(null);
      await EmergencyProfileStore.updateContact(contact);
      const updated = await EmergencyProfileStore.loadContactsLocal();
      setContactsState(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update contact';
      setError(message);
      throw err;
    }
  };

  const removeContact = async (contactId: string) => {
    try {
      setError(null);
      await EmergencyProfileStore.removeContact(contactId);
      const updated = await EmergencyProfileStore.loadContactsLocal();
      setContactsState(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove contact';
      setError(message);
      throw err;
    }
  };

  const refresh = async () => {
    await loadData();
  };

  const isProfileComplete = (): boolean => {
    if (!profile) return false;

    const { isValid } = EmergencyProfileStore.validateProfile(profile);
    return isValid;
  };

  const value: EmergencyProfileContextValue = {
    profile,
    contacts,
    isLoading,
    error,
    setProfile,
    updateProfile,
    addContact,
    updateContact,
    removeContact,
    refresh,
    isProfileComplete,
  };

  return (
    <EmergencyProfileContext.Provider value={value}>
      {children}
    </EmergencyProfileContext.Provider>
  );
};

/**
 * Hook to use emergency profile context
 */
export const useEmergencyProfile = () => {
  const context = useContext(EmergencyProfileContext);

  if (!context) {
    throw new Error(
      'useEmergencyProfile must be used within EmergencyProfileProvider',
    );
  }

  return context;
};
