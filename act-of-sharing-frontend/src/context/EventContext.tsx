import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import axiosInstance from '../api/axiosInstance';
import type { EventFormData } from '../modals/EventCreationForm';
import { useAuth } from '../context/AuthContext';

export interface Event {
  _id: string;
  hostId: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  guestCount: number;
  suggestedDonation: number;
  imageUrl?: string;
  isPublic: boolean;
  uniqueUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EventContextType {
  events: Event[];
  loading: boolean;
  error: string | null;
  createEvent: (formData: FormData) => Promise<void>;
  getEvents: (page?: number, limit?: number) => Promise<{ events: Event[], pagination: { currentPage: number, totalPages: number, totalEvents: number, limit: number } }>;
  getPublicEvents: (params?: GetPublicEventsParams) => Promise<{ events: Event[], pagination: { currentPage: number, totalPages: number, totalEvents: number, limit: number } }>;
  getHostSpecificEvents: (page?: number, limit?: number) => Promise<{ events: Event[], pagination: { currentPage: number, totalPages: number, totalEvents: number, limit: number } }>;
  updateEvent: (id: string, formData: FormData) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  sendInvitation: (toEmail: string, eventId: string) => Promise<void>;
  getEventById: (id: string) => Promise<Event | null>;
}

interface GetPublicEventsParams {
  page?: number;
  limit?: number;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, refreshToken } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getEvents = useCallback(async (page: number = 1, limit: number = 100) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || (await refreshToken());
      const response = await axiosInstance.get(`/events?page=${page}&limit=${limit}`, {
        headers: { 'x-auth-token': token, 'X-Skip-Redirect': 'true' },
      });
      const eventsData = Array.isArray(response.data.events) ? response.data.events : [];
      setEvents(eventsData); // Ensure state is updated
      setError(null);
      return {
        events: eventsData,
        pagination: {
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalEvents: response.data.pagination.totalEvents,
          limit: response.data.pagination.limit,
        },
      };
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch events');
      setEvents([]);
      return { events: [], pagination: { currentPage: 1, totalPages: 1, totalEvents: 0, limit } };
    } finally {
      setLoading(false);
    }
  }, [refreshToken]);

  const getPublicEvents = useCallback(async ({ page = 1, limit = 3 }: GetPublicEventsParams = {}) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/events/public?page=${page}&limit=${limit}`, {
        headers: { 'X-Skip-Redirect': 'true' },
      });
      const eventsData = Array.isArray(response.data.events) ? response.data.events : [];
      setEvents(eventsData); // Ensure state is updated
      setError(null);
      return {
        events: eventsData,
        pagination: {
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalEvents: response.data.pagination.totalEvents,
          limit: response.data.pagination.limit,
        },
      };
    } catch (err: any) {
      setError(`Failed to fetch public events: ${err.response?.data?.message || err.message}`);
      setEvents([]);
      return { events: [], pagination: { currentPage: 1, totalPages: 1, totalEvents: 0, limit } };
    } finally {
      setLoading(false);
    }
  }, []);

  const getHostSpecificEvents = useCallback(async (page: number = 1, limit: number = 10) => { // Changed limit to 10 to match MyEventsPage
    console.log('Fetching host-specific events for user:', user?.id);
    if (!user || !isAuthenticated) {
      setError('User must be authenticated to fetch host-specific events');
      return { events: [], pagination: { currentPage: 1, totalPages: 1, totalEvents: 0, limit } };
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || (await refreshToken());
      const response = await axiosInstance.get(`/events/my-events?page=${page}&limit=${limit}`, {
        headers: { 'x-auth-token': token, 'X-Skip-Redirect': 'true' },
      });
      const eventsData = Array.isArray(response.data.events) ? response.data.events : [];
      console.log('Host-specific events fetched:', eventsData);
      setEvents(eventsData); // Ensure state is updated
      setError(null);
      return {
        events: eventsData,
        pagination: {
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalEvents: response.data.pagination.totalEvents,
          limit: response.data.pagination.limit,
        },
      };
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch host-specific events');
      setEvents([]);
      return { events: [], pagination: { currentPage: 1, totalPages: 1, totalEvents: 0, limit } };
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, refreshToken]);

  const getEventById = useCallback(async (id: string): Promise<Event | null> => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/events/${id}`, {
        headers: { 'X-Skip-Redirect': 'true' },
      });
      setError(null);
      return response.data;
    } catch (err: any) {
      setError(`Failed to fetch event: ${err.response?.data?.message || err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = useCallback(
    async (formData: FormData) => {
      if (!user) {
        setError('User must be logged in to create an event');
        return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem('token') || (await refreshToken());
        const response = await axiosInstance.post('/events', formData, {
          headers: { 'Content-Type': 'multipart/form-data', 'x-auth-token': token, 'X-Skip-Redirect': 'true' },
        });
        setEvents((prev) => [...prev, response.data.event]);
        setError(null);
        await getHostSpecificEvents();
      } catch (err: any) {
        setError(`Failed to create event: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    },
    [user, getHostSpecificEvents, refreshToken]
  );

  const updateEvent = useCallback(
    async (id: string, formData: FormData) => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') || (await refreshToken());
        const response = await axiosInstance.put(`/events/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', 'x-auth-token': token, 'X-Skip-Redirect': 'true' },
        });
        setEvents((prev) => prev.map((evt) => (evt._id === id ? response.data : evt)));
        setError(null);
        await getHostSpecificEvents();
      } catch (err: any) {
        setError(`Failed to update event: ${err.response?.data?.message || err.message}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getHostSpecificEvents, refreshToken]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') || (await refreshToken());
        await axiosInstance.delete(`/events/${id}`, { headers: { 'x-auth-token': token, 'X-Skip-Redirect': 'true' } });
        setEvents((prev) => prev.filter((evt) => evt._id !== id));
        setError(null);
        await getHostSpecificEvents();
      } catch (err: any) {
        setError(`Failed to delete event: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    },
    [getHostSpecificEvents, refreshToken]
  );

  const sendInvitation = useCallback(
    async (toEmail: string, eventId: string) => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') || (await refreshToken());
        await axiosInstance.post('/events/invite-by-email', { to: toEmail, eventId }, {
          headers: { 'x-auth-token': token, 'X-Skip-Redirect': 'true' },
        });
        setError(null);
      } catch (err: any) {
        setError(`Failed to send invitation: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    },
    [refreshToken]
  );

  useEffect(() => {
    if (user) getHostSpecificEvents();
  }, [user, getHostSpecificEvents]);

  const contextValue = useMemo(
    () => ({
      events,
      loading,
      error,
      createEvent,
      getEvents,
      getPublicEvents,
      getHostSpecificEvents,
      updateEvent,
      deleteEvent,
      sendInvitation,
      getEventById,
    }),
    [
      events,
      loading,
      error,
      createEvent,
      getEvents,
      getPublicEvents,
      getHostSpecificEvents,
      updateEvent,
      deleteEvent,
      sendInvitation,
      getEventById,
    ]
  );

  return <EventContext.Provider value={contextValue}>{children}</EventContext.Provider>;
};

export const useEvent = (): EventContextType => {
  const context = useContext(EventContext);
  if (!context) throw new Error('useEvent must be used within an EventProvider');
  return context;
};