export interface DashboardFilter {
  from: string;        // 'YYYY-MM-DD'
  to: string;           // 'YYYY-MM-DD'
  investmentId: number | null;   // null = "todas las inversiones"
}