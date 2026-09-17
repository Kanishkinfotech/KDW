import { prisma } from '../database/db';
import { getSettingsByGroup } from '../controllers/settings/settingsService';

export class RetentionService {
  /**
   * Executes database retention cleanup based on configured Admin Privacy & Retention policies
   */
  public static async executeRetentionCleanup(): Promise<{
    expiredTokensCleaned: number;
    expiredSessionsCleaned: number;
    oldLogsCleaned: number;
  }> {
    try {
      const settings = await getSettingsByGroup('PRIVACY');

      const downloadLogDays = Number(settings.retention_download_logs_days) || 90;
      const sessionDays = Number(settings.retention_sessions_days) || 30;
      const auditLogDays = Number(settings.retention_audit_logs_days) || 365;

      const now = new Date();
      const sessionCutoff = new Date(now.getTime() - sessionDays * 24 * 60 * 60 * 1000);
      const downloadLogCutoff = new Date(now.getTime() - downloadLogDays * 24 * 60 * 60 * 1000);

      // 1. Delete expired / invalidated Download Tokens
      const tokenResult = await prisma.downloadToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now }, status: { in: ['EXPIRED', 'CONSUMED', 'REVOKED'] } },
            { status: 'REVOKED' }
          ]
        }
      });

      // 2. Delete expired customer sessions
      const sessionResult = await prisma.customerSession.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { revokedAt: { not: null } },
            { createdAt: { lt: sessionCutoff } }
          ]
        }
      });

      // 3. Delete old processed Webhook Logs beyond cutoff
      const webhookLogResult = await prisma.paymentEvent.deleteMany({
        where: {
          status: { in: ['PROCESSED', 'DUPLICATE'] },
          receivedAt: { lt: downloadLogCutoff }
        }
      });

      console.log(`[RetentionService] Cleanup completed: ${tokenResult.count} tokens, ${sessionResult.count} sessions, ${webhookLogResult.count} webhook logs purged.`);

      return {
        expiredTokensCleaned: tokenResult.count,
        expiredSessionsCleaned: sessionResult.count,
        oldLogsCleaned: webhookLogResult.count
      };
    } catch (err: any) {
      console.error('[RetentionService] Retention cleanup error:', err);
      return {
        expiredTokensCleaned: 0,
        expiredSessionsCleaned: 0,
        oldLogsCleaned: 0
      };
    }
  }

  /**
   * Initializes the scheduled daily retention timer
   */
  public static startDailyRetentionSchedule() {
    // Run initial cleanup 10 seconds after server startup
    setTimeout(() => {
      this.executeRetentionCleanup().catch(err => console.error('[RetentionService] Initial run error:', err));
    }, 10000);

    // Schedule to run every 24 hours (86400000 ms)
    setInterval(() => {
      this.executeRetentionCleanup().catch(err => console.error('[RetentionService] Periodic run error:', err));
    }, 24 * 60 * 60 * 1000);
  }
}
