import { Response } from 'express';

interface SseClient {
  id: string;
  res: Response;
  userId?: string;
  connectedAt: Date;
}

class DashboardBroadcastService {
  private clients: Map<string, SseClient> = new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initHeartbeat();
  }

  private initHeartbeat() {
    // Send a keep-alive comment every 25 seconds to prevent browser/proxy connection timeouts
    this.heartbeatTimer = setInterval(() => {
      this.clients.forEach((client, id) => {
        try {
          client.res.write(`: heartbeat ${new Date().toISOString()}\n\n`);
        } catch (err) {
          this.removeClient(id);
        }
      });
    }, 25000);
  }

  /**
   * Register a new SSE connection from an authenticated admin client
   */
  public addClient(id: string, res: Response, userId?: string) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable proxy buffering (Nginx, etc.)
    });

    // Send initial connected confirmation
    res.write(`data: ${JSON.stringify({ event: 'connected', clientId: id, timestamp: new Date().toISOString() })}\n\n`);

    this.clients.set(id, {
      id,
      res,
      userId,
      connectedAt: new Date()
    });

    res.on('close', () => {
      this.removeClient(id);
    });

    res.on('error', () => {
      this.removeClient(id);
    });
  }

  /**
   * Remove a disconnected client
   */
  public removeClient(id: string) {
    if (this.clients.has(id)) {
      this.clients.delete(id);
    }
  }

  /**
   * Broadcast an event to all connected admin clients
   */
  public broadcast(eventType: string, payload: any = {}) {
    const message = JSON.stringify({
      event: eventType,
      data: payload,
      timestamp: new Date().toISOString()
    });

    this.clients.forEach((client, id) => {
      try {
        client.res.write(`data: ${message}\n\n`);
      } catch (err) {
        this.removeClient(id);
      }
    });
  }

  public getActiveClientsCount(): number {
    return this.clients.size;
  }
}

export const dashboardBroadcaster = new DashboardBroadcastService();
