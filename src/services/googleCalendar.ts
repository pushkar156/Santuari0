/**
 * Service for interacting with the Google Calendar API via chrome.identity
 */

const BASE_URL = 'https://www.googleapis.com/calendar/v3';

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  primary?: boolean;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink: string;
  colorId?: string;
  status: string;
}

export class GoogleCalendarService {
  private static async getAuthToken(interactive: boolean = false): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (!token) {
          reject(new Error('No token received'));
        } else {
          resolve(token);
        }
      });
    });
  }

  private static async fetchWithAuth(url: string, options: RequestInit = {}, interactive: boolean = false): Promise<Response> {
    const token = await this.getAuthToken(interactive);
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
      await new Promise<void>((resolve) => {
        chrome.identity.removeCachedAuthToken({ token }, () => resolve());
      });
      const newToken = await this.getAuthToken(true);
      headers.set('Authorization', `Bearer ${newToken}`);
      return fetch(url, { ...options, headers });
    }
    
    return response;
  }

  /**
   * Fetch all calendars for the current user
   */
  static async listCalendars(interactive: boolean = false): Promise<GoogleCalendar[]> {
    const response = await this.fetchWithAuth(`${BASE_URL}/users/me/calendarList`, {}, interactive);
    if (!response.ok) throw new Error('Failed to fetch calendar list');
    const data = await response.json();
    return data.items || [];
  }

  /**
   * Fetch events for a specific calendar
   */
  static async listEvents(
    calendarId: string = 'primary', 
    timeMin: string = new Date().toISOString(),
    timeMax?: string,
    maxResults: number = 250
  ): Promise<CalendarEvent[]> {
    let allEvents: CalendarEvent[] = [];
    let pageToken: string | undefined;

    do {
      const url = new URL(`${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events`);
      url.searchParams.append('timeMin', timeMin);
      url.searchParams.append('singleEvents', 'true');
      url.searchParams.append('orderBy', 'startTime');
      url.searchParams.append('maxResults', maxResults.toString());
      if (timeMax) url.searchParams.append('timeMax', timeMax);
      if (pageToken) url.searchParams.append('pageToken', pageToken);

      const response = await this.fetchWithAuth(url.toString());
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      if (data.items) {
        allEvents = [...allEvents, ...data.items];
      }
      pageToken = data.nextPageToken;
    } while (pageToken);

    return allEvents;
  }

  /**
   * Update an existing event
   */
  static async updateEvent(calendarId: string, eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const response = await this.fetchWithAuth(`${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update event');
    return response.json();
  }

  /**
   * Delete an event
   */
  static async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    const response = await this.fetchWithAuth(`${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete event');
  }

  /**
   * Create a new event
   */
  static async createEvent(calendarId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const response = await this.fetchWithAuth(`${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!response.ok) throw new Error('Failed to create event');
    return response.json();
  }

  /**
   * Sign out (remove token)
   */
  static async signOut(): Promise<void> {
    const token = await this.getAuthToken();
    if (token) {
      return new Promise((resolve) => {
        chrome.identity.removeCachedAuthToken({ token }, () => resolve());
      });
    }
  }
}
