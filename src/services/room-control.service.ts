/**
 * Room Control Service - Sensorisch LABO API Integration
 * Based on API Documentation v0.4
 *
 * This service provides both real and mock implementations for controlling
 * the sensory lab room system via API.
 */

export type RoomState = 'standby' | 'pressurizing' | 'ready' | 'valve_opened' | 'error';

export interface RoomStatus {
  wifi_connected: boolean;
  state: RoomState;
  pressure: number;
  selected: number; // -1 if no selection, 1-8 for room selection
}

export interface RoomError {
  error: string;
}

interface RoomSelectResponse {
  selected: number;
}

interface RoomStateResponse {
  state: RoomState;
}

// Mock state for testing when not connected to real hardware
class MockRoomControlState {
  private status: RoomStatus = {
    wifi_connected: true,
    state: 'standby',
    pressure: 0,
    selected: -1,
  };

  private lastError: string | null = null;
  private pressurizeTimer: NodeJS.Timeout | null = null;
  private openTimer: NodeJS.Timeout | null = null;

  getStatus(): RoomStatus {
    return { ...this.status };
  }

  getError(): RoomError {
    return { error: this.lastError || 'no error' };
  }

  async pressurize(): Promise<RoomStateResponse> {
    if (this.status.state !== 'standby' && this.status.state !== 'ready') {
      this.lastError = 'Cannot pressurize from current state';
      this.status.state = 'error';
      return { state: 'error' };
    }

    this.status.state = 'pressurizing';
    this.status.pressure = 0;

    // Simulate pressure build-up over 2 seconds
    if (this.pressurizeTimer) clearTimeout(this.pressurizeTimer);

    return new Promise((resolve) => {
      this.pressurizeTimer = setTimeout(() => {
        this.status.state = 'ready';
        this.status.pressure = 4.87; // Target pressure in Volts
        resolve({ state: 'ready' });
      }, 2000);
    });
  }

  async selectRoom(roomId: number): Promise<RoomSelectResponse> {
    if (roomId < 1 || roomId > 8) {
      this.lastError = `Invalid room ID: ${roomId}. Must be between 1-8`;
      this.status.state = 'error';
      throw new Error(this.lastError);
    }

    if (this.status.state !== 'ready') {
      this.lastError = 'System must be in ready state to select room';
      this.status.state = 'error';
      throw new Error(this.lastError);
    }

    this.status.selected = roomId;
    return { selected: roomId };
  }

  async clearSelection(): Promise<RoomSelectResponse> {
    this.status.selected = -1;
    return { selected: -1 };
  }

  async openRoom(): Promise<RoomStateResponse> {
    if (this.status.selected === -1) {
      this.lastError = 'No room selected';
      this.status.state = 'error';
      throw new Error(this.lastError);
    }

    if (this.status.state !== 'ready') {
      this.lastError = 'System must be in ready state to open room';
      this.status.state = 'error';
      throw new Error(this.lastError);
    }

    this.status.state = 'valve_opened';

    // Simulate valve opening for 3 seconds
    if (this.openTimer) clearTimeout(this.openTimer);

    return new Promise((resolve) => {
      this.openTimer = setTimeout(() => {
        this.status.state = 'ready';
        resolve({ state: 'ready' });
      }, 3000);
    });
  }

  async standby(): Promise<RoomStateResponse> {
    if (this.pressurizeTimer) {
      clearTimeout(this.pressurizeTimer);
      this.pressurizeTimer = null;
    }
    if (this.openTimer) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }

    this.status.state = 'standby';
    this.status.pressure = 0;
    this.status.selected = -1;

    return { state: 'standby' };
  }

  reset(): void {
    this.status = {
      wifi_connected: true,
      state: 'standby',
      pressure: 0,
      selected: -1,
    };
    this.lastError = null;
    if (this.pressurizeTimer) {
      clearTimeout(this.pressurizeTimer);
      this.pressurizeTimer = null;
    }
    if (this.openTimer) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
  }
}

// Real API implementation
class RealRoomControlAPI {
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor(baseUrl: string, username: string, password: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.username = username;
    this.password = password;
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    return `Basic ${credentials}`;
  }

  private async fetch<T>(endpoint: string, method: 'GET' | 'POST' = 'GET'): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        Authorization: this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getStatus(): Promise<RoomStatus> {
    return this.fetch<RoomStatus>('/status', 'GET');
  }

  async getError(): Promise<RoomError> {
    return this.fetch<RoomError>('/error', 'GET');
  }

  async pressurize(): Promise<RoomStateResponse> {
    return this.fetch<RoomStateResponse>('/pressurize', 'POST');
  }

  async selectRoom(roomId: number): Promise<RoomSelectResponse> {
    return this.fetch<RoomSelectResponse>(`/select/${roomId}`, 'POST');
  }

  async clearSelection(): Promise<RoomSelectResponse> {
    return this.fetch<RoomSelectResponse>('/select/clear', 'POST');
  }

  async openRoom(): Promise<RoomStateResponse> {
    return this.fetch<RoomStateResponse>('/open', 'POST');
  }

  async standby(): Promise<RoomStateResponse> {
    return this.fetch<RoomStateResponse>('/standby', 'POST');
  }
}

// Service configuration
const USE_MOCK_API = process.env.ROOM_CONTROL_MOCK === 'true';
const ROOM_CONTROL_URL = process.env.ROOM_CONTROL_URL || 'http://192.168.0.237';
const ROOM_CONTROL_USERNAME = process.env.ROOM_CONTROL_USERNAME || 'admin';
const ROOM_CONTROL_PASSWORD = process.env.ROOM_CONTROL_PASSWORD || 'secret';

console.log('[RoomControl] Configuration:', {
  USE_MOCK_API,
  ROOM_CONTROL_MOCK: process.env.ROOM_CONTROL_MOCK,
  ROOM_CONTROL_URL,
});

// Singleton instances
const mockState = new MockRoomControlState();
const realAPI = new RealRoomControlAPI(
  ROOM_CONTROL_URL,
  ROOM_CONTROL_USERNAME,
  ROOM_CONTROL_PASSWORD
);

// Unified service interface
export const roomControlService = {
  /**
   * Get current system status
   */
  async getStatus(): Promise<{ success: boolean; data?: RoomStatus; error?: string }> {
    try {
      console.log('[RoomControl] getStatus - USE_MOCK_API:', USE_MOCK_API);
      const data = USE_MOCK_API ? mockState.getStatus() : await realAPI.getStatus();
      console.log('[RoomControl] getStatus - data:', data);
      return { success: true, data };
    } catch (error) {
      console.error('[RoomControl] getStatus - error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get status',
      };
    }
  },

  /**
   * Get last error message from system
   */
  async getError(): Promise<{ success: boolean; data?: RoomError; error?: string }> {
    try {
      const data = USE_MOCK_API ? mockState.getError() : await realAPI.getError();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get error',
      };
    }
  },

  /**
   * Start pressure build-up in the system
   * System transitions from standby -> pressurizing -> ready
   */
  async pressurize(): Promise<{ success: boolean; data?: RoomStateResponse; error?: string }> {
    try {
      console.log('[Backend] POST /pressurize - Starting pressurization');
      const data = USE_MOCK_API ? await mockState.pressurize() : await realAPI.pressurize();
      console.log('[Backend] POST /pressurize ->', data);
      return { success: true, data };
    } catch (error) {
      console.error('[Backend] POST /pressurize - Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to pressurize',
      };
    }
  },

  /**
   * Select a room (1-8)
   * System must be in ready state
   */
  async selectRoom(roomId: number): Promise<{ success: boolean; data?: RoomSelectResponse; error?: string }> {
    try {
      console.log(`[Backend] POST /select/${roomId} - Selecting room ${roomId}`);
      const data = USE_MOCK_API ? await mockState.selectRoom(roomId) : await realAPI.selectRoom(roomId);
      console.log(`[Backend] POST /select/${roomId} ->`, data);
      return { success: true, data };
    } catch (error) {
      console.error(`[Backend] POST /select/${roomId} - Error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to select room',
      };
    }
  },

  /**
   * Clear current room selection
   */
  async clearSelection(): Promise<{ success: boolean; data?: RoomSelectResponse; error?: string }> {
    try {
      const data = USE_MOCK_API ? await mockState.clearSelection() : await realAPI.clearSelection();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear selection',
      };
    }
  },

  /**
   * Open the selected room valve
   * Room must be selected and system must be in ready state
   * Valve opens for approximately 3 seconds
   */
  async openRoom(): Promise<{ success: boolean; data?: RoomStateResponse; error?: string }> {
    try {
      console.log('[Backend] POST /open - Opening room valve');
      const data = USE_MOCK_API ? await mockState.openRoom() : await realAPI.openRoom();
      console.log('[Backend] POST /open ->', data);
      return { success: true, data };
    } catch (error) {
      console.error('[Backend] POST /open - Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open room',
      };
    }
  },

  /**
   * Reset system to standby
   * Pumps off, selection cleared
   */
  async standby(): Promise<{ success: boolean; data?: RoomStateResponse; error?: string }> {
    try {
      console.log('[Backend] POST /standby - Returning to standby');
      const data = USE_MOCK_API ? await mockState.standby() : await realAPI.standby();
      console.log('[Backend] POST /standby ->', data);
      return { success: true, data };
    } catch (error) {
      console.error('[Backend] POST /standby - Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to go to standby',
      };
    }
  },

  /**
   * Execute complete workflow to prepare and open a room
   * Returns status at each step with detailed command log
   */
  async prepareAndOpenRoom(roomId: number): Promise<{
    success: boolean;
    steps?: {
      pressurize: boolean;
      select: boolean;
      open: boolean;
    };
    commandLog?: Array<{
      timestamp: string;
      endpoint: string;
      request?: any;
      response?: any;
    }>;
    error?: string;
  }> {
    console.log('[RoomControl] prepareAndOpenRoom - roomId:', roomId);
    const steps = {
      pressurize: false,
      select: false,
      open: false,
    };
    const commandLog: Array<{
      timestamp: string;
      endpoint: string;
      request?: any;
      response?: any;
    }> = [];

    const logCommand = (endpoint: string, request?: any, response?: any) => {
      const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false, fractionalSecondDigits: 3 });
      commandLog.push({ timestamp, endpoint, request, response });
      console.log(`[RoomControl] ${timestamp} ${endpoint}`, response);
    };

    try {
      // Step 1: Check current status
      console.log('[RoomControl] Step 1: Checking status...');
      const statusResult = await this.getStatus();
      logCommand('GET /status', undefined, statusResult.data);
      if (!statusResult.success || !statusResult.data) {
        return { success: false, error: 'Failed to get initial status', steps, commandLog };
      }

      // Step 2: Pressurize if needed
      console.log('[RoomControl] Step 2: Current state:', statusResult.data.state);
      if (statusResult.data.state === 'standby') {
        console.log('[RoomControl] Pressurizing...');
        const pressurizeResult = await this.pressurize();
        logCommand('POST /pressurize', undefined, pressurizeResult.data);
        if (!pressurizeResult.success) {
          return { success: false, error: 'Failed to pressurize system', steps, commandLog };
        }

        // Wait for system to be ready (poll status)
        console.log('[RoomControl] Waiting for system to be ready...');
        let retries = 0;
        while (retries < 10) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const checkStatus = await this.getStatus();
          logCommand('GET /status', undefined, checkStatus.data);
          console.log('[RoomControl] Poll attempt', retries, '- state:', checkStatus.data?.state);
          if (checkStatus.success && checkStatus.data?.state === 'ready') {
            break;
          }
          retries++;
        }
      }
      steps.pressurize = true;
      console.log('[RoomControl] Pressurize step complete');

      // Step 3: Select room
      console.log('[RoomControl] Step 3: Selecting room', roomId);
      const selectResult = await this.selectRoom(roomId);
      logCommand('POST /select/' + roomId, { roomId }, selectResult.data);
      if (!selectResult.success) {
        return { success: false, error: `Failed to select room ${roomId}`, steps, commandLog };
      }
      steps.select = true;
      console.log('[RoomControl] Select step complete');

      // Step 4: Open room
      console.log('[RoomControl] Step 4: Opening room');
      const openResult = await this.openRoom();
      logCommand('POST /open', undefined, openResult.data);
      if (!openResult.success) {
        return { success: false, error: 'Failed to open room', steps, commandLog };
      }
      steps.open = true;
      console.log('[RoomControl] Open step complete');

      console.log('[RoomControl] All steps complete!');
      return { success: true, steps, commandLog };
    } catch (error) {
      console.error('[RoomControl] Error in prepareAndOpenRoom:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to prepare and open room',
        steps,
        commandLog,
      };
    }
  },

  /**
   * Close current session and return to standby
   */
  async closeSession(): Promise<{ success: boolean; error?: string }> {
    try {
      const standbyResult = await this.standby();
      if (!standbyResult.success) {
        return { success: false, error: 'Failed to return to standby' };
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to close session',
      };
    }
  },

  /**
   * Check if using mock API
   */
  isMockMode(): boolean {
    return USE_MOCK_API;
  },

  /**
   * Reset mock state (only works in mock mode)
   */
  resetMock(): void {
    if (USE_MOCK_API) {
      mockState.reset();
    }
  },
};
