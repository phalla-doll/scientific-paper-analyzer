
const STORAGE_KEY = 'gemini_usage_logs';

interface UsageLog {
  timestamp: number;
  type: 'text' | 'pdf';
}

interface RateLimitConfig {
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
  cooldownBetweenRequests: number; // in ms
}

// Configuration: Strict limits for MVP public demo
const CONFIG: RateLimitConfig = {
  maxRequestsPerHour: 5,   // Max 5 papers/texts per hour
  maxRequestsPerDay: 20,   // Max 20 per day
  cooldownBetweenRequests: 10000 // 10 seconds mandatory wait between requests
};

export const checkRateLimit = (): { allowed: boolean; reason?: string; waitTime?: number } => {
  const now = Date.now();
  const rawLogs = localStorage.getItem(STORAGE_KEY);
  let logs: UsageLog[] = rawLogs ? JSON.parse(rawLogs) : [];

  // 1. Clean up old logs (> 24 hours)
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  logs = logs.filter(log => log.timestamp > oneDayAgo);

  // 2. Check Cooldown (Spam clicking prevention)
  const lastRequest = logs[logs.length - 1];
  if (lastRequest && (now - lastRequest.timestamp) < CONFIG.cooldownBetweenRequests) {
    const waitTime = Math.ceil((CONFIG.cooldownBetweenRequests - (now - lastRequest.timestamp)) / 1000);
    return { 
      allowed: false, 
      reason: `System cooling down. Please wait ${waitTime} seconds.`,
      waitTime
    };
  }

  // 3. Check Hourly Limit
  const oneHourAgo = now - 60 * 60 * 1000;
  const requestsLastHour = logs.filter(log => log.timestamp > oneHourAgo).length;
  if (requestsLastHour >= CONFIG.maxRequestsPerHour) {
    return { 
      allowed: false, 
      reason: `Hourly limit reached (${CONFIG.maxRequestsPerHour}/hr). Try again later.` 
    };
  }

  // 4. Check Daily Limit
  if (logs.length >= CONFIG.maxRequestsPerDay) {
    return { 
      allowed: false, 
      reason: `Daily limit reached (${CONFIG.maxRequestsPerDay}/day).` 
    };
  }

  return { allowed: true };
};

export const recordUsage = (type: 'text' | 'pdf') => {
  const now = Date.now();
  const rawLogs = localStorage.getItem(STORAGE_KEY);
  let logs: UsageLog[] = rawLogs ? JSON.parse(rawLogs) : [];
  
  logs.push({ timestamp: now, type });
  
  // Cleanup old logs before saving
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  logs = logs.filter(log => log.timestamp > oneDayAgo);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
};

export const getRemainingQuota = () => {
  const now = Date.now();
  const rawLogs = localStorage.getItem(STORAGE_KEY);
  const logs: UsageLog[] = rawLogs ? JSON.parse(rawLogs) : [];
  
  const oneHourAgo = now - 60 * 60 * 1000;
  const usedHour = logs.filter(log => log.timestamp > oneHourAgo).length;
  
  return {
    hour: Math.max(0, CONFIG.maxRequestsPerHour - usedHour),
    day: Math.max(0, CONFIG.maxRequestsPerDay - logs.length)
  };
};
