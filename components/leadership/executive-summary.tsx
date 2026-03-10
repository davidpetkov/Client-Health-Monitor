"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStats {
  totalClients: number;
  averageHealthScore: number;
  atRiskAccounts: number;
}

interface ExecutiveSummaryProps {
  clientsData: Array<{
    id: string;
    name: string;
    industry: string | null;
    coach_name: string;
    current_score: number;
    predictive_score: number;
    week_of: string;
    notes: string | null;
    action_items: string | null;
    risk_status: 'healthy' | 'needs-attention' | 'at-risk';
  }>;
}

export function ExecutiveSummary({ clientsData }: ExecutiveSummaryProps) {
  try {
    // Calculate stats from the provided clients data
    const totalClients = clientsData.length;
    
    let totalScore = 0;
    let atRiskCount = 0;
    let validScoreCount = 0;

    clientsData.forEach(client => {
      if (client.predictive_score > 0) {
        totalScore += client.predictive_score;
        validScoreCount++;
      }
      
      if (client.risk_status === 'at-risk') {
        atRiskCount++;
      }
    });

    const averageHealthScore = validScoreCount > 0 ? totalScore / validScoreCount : 0;

    const stats: DashboardStats = {
      totalClients,
      averageHealthScore: parseFloat(averageHealthScore.toFixed(1)),
      atRiskAccounts: atRiskCount
    };

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Across all coaches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageHealthScore}/5</div>
            <p className="text-xs text-muted-foreground">
              Predictive score average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.atRiskAccounts}</div>
            <p className="text-xs text-muted-foreground">
              Scores ≤ 2
            </p>
          </CardContent>
        </Card>
      </div>
    );
  } catch {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading stats</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading stats</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading stats</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}