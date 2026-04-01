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
}

export type FilterType = CheckStatus | 'ALL';

export interface LogEntry {
  timestamp: number; // Date.now()
  status: CheckStatus;
  message: string;
  latency?: number;
}
