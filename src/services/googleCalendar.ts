/**
 * Service for interacting with the Google Calendar API via chrome.identity
 */

const BASE_URL = 'https://www.googleapis.com/calendar/v3';

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

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
  primary?: boolean;
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
   * List all calendars for the current user
   */
  static async listCalendars(interactive: boolean = false): Promise<GoogleCalendar[]> {
    const response = await this.fetchWithAuth(`${BASE_URL}/users/me/calendarList`, {}, interactive);
    if (!response.ok) throw new Error('Failed to fetch calendars');
    const data = await response.json();
    return data.items || [];
  }

  /**
   * List events for a specific calendar
   */
  static async listEvents(
    calendarId: string = 'primary',
    timeMin: string = new Date().toISOString(),
    maxResults: number = 50
  ): Promise<CalendarEvent[]> {
    const url = new URL(`${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events`);
    url.searchParams.append('timeMin', timeMin);
    url.searchParams.append('singleEvents', 'true');
    url.searchParams.append('orderBy', 'startTime');
    url.searchParams.append('maxResults', maxResults.toString());

    const response = await this.fetchWithAuth(url.toString());
    if (!response.ok) throw new Error('Failed to fetch events');
    const data = await response.json();
    return data.items || [];
  }
}
