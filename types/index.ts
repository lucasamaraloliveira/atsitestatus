export enum CheckStatus {
  ONLINE = 'Online',
  OFFLINE = 'Offline',
  CHECKING = 'Verificando',
  ERROR = 'Erro',
}

export interface StatusResult {
  id: string;
  url: string;
  name?: string;
  keyword?: string;
  status: CheckStatus;
  message: string;
  timestamp: string;
  latency?: number;
  sslExpiryDate?: number;
  sslDaysRemaining?: number;
}

export interface Incident {
    id: string;
    siteId: string;
    siteName: string;
    status: 'active' | 'resolved'; // resolved = post-mortem disponível
    startTime: number;
    endTime?: number;
    duration?: string; 
    rootCause?: string; 
    resolution?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    logs?: LogEntry[]; // Logs vinculados a este incidente
}

export type FilterType = CheckStatus | 'ALL';

export interface LogEntry {
  timestamp: number; // Date.now()
  status: CheckStatus;
  message: string;
  latency?: number;
  incidentId?: string; // Vínculo com incidente se houver
}

export interface AudioSettings {
  enabled: boolean;
  triggers: ('offline' | 'online' | 'error' | 'latency')[];
  selectedSound: string;
}
