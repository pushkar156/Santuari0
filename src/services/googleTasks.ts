/**
 * Service for interacting with the Google Tasks API via chrome.identity
 */

const BASE_URL = 'https://www.googleapis.com/tasks/v1';

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  updated: string;
  parent?: string;
  position: string;
}

export interface GoogleTaskList {
  id: string;
  title: string;
  updated: string;
  selfLink: string;
}

export class GoogleTasksService {
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
      // Token might be expired, remove it and try one more time
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
   * Fetch all task lists for the current user
   */
  static async listTaskLists(interactive: boolean = false): Promise<GoogleTaskList[]> {
    let allLists: GoogleTaskList[] = [];
    let pageToken: string | undefined;

    do {
      const url = new URL(`${BASE_URL}/users/@me/lists`);
      if (pageToken) url.searchParams.append('pageToken', pageToken);
      
      const response = await this.fetchWithAuth(url.toString(), {}, interactive);
      if (!response.ok) throw new Error('Failed to fetch task lists');
      
      const data = await response.json();
      if (data.items) {
        allLists = [...allLists, ...data.items];
      }
      pageToken = data.nextPageToken;
    } while (pageToken);

    return allLists;
  }

  /**
   * Fetch tasks for a specific list
   */
  static async listTasks(listId: string): Promise<GoogleTask[]> {
    let allTasks: GoogleTask[] = [];
    let pageToken: string | undefined;

    do {
      const url = new URL(`${BASE_URL}/lists/${listId}/tasks`);
      url.searchParams.append('showCompleted', 'true');
      url.searchParams.append('showHidden', 'true');
      url.searchParams.append('maxResults', '100');
      if (pageToken) url.searchParams.append('pageToken', pageToken);

      const response = await this.fetchWithAuth(url.toString());
      if (!response.ok) throw new Error('Failed to fetch tasks');
      
      const data = await response.json();
      if (data.items) {
        allTasks = [...allTasks, ...data.items];
      }
      pageToken = data.nextPageToken;
    } while (pageToken);

    return allTasks;
  }

  /**
   * Create a new task in a list
   */
  static async createTask(listId: string, title: string): Promise<GoogleTask> {
    const response = await this.fetchWithAuth(`${BASE_URL}/lists/${listId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, status: 'needsAction' }),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  }

  /**
   * Update an existing task
   */
  static async updateTask(listId: string, taskId: string, updates: Partial<GoogleTask>): Promise<GoogleTask> {
    const response = await this.fetchWithAuth(`${BASE_URL}/lists/${listId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  }

  /**
   * Delete a task
   */
  static async deleteTask(listId: string, taskId: string): Promise<void> {
    const response = await this.fetchWithAuth(`${BASE_URL}/lists/${listId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete task');
  }

  /**
   * Create a new task list
   */
  static async createTaskList(title: string): Promise<GoogleTaskList> {
    const response = await this.fetchWithAuth(`${BASE_URL}/users/@me/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error('Failed to create task list');
    return response.json();
  }

  /**
   * Sign out (remove token)
   */
  static async signOut(): Promise<void> {
    const token = await this.getAuthToken();
    return new Promise((resolve) => {
      chrome.identity.removeCachedAuthToken({ token }, () => resolve());
    });
  }
}
