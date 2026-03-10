"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ClientData {
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
}

interface RedZoneProps {
  clientsData: ClientData[];
}

function getScoreColor(score: number): string {
  if (score <= 2) return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20";
  if (score === 3) return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20";
  return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20";
}

function formatWeekDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

export function RedZone({ clientsData }: RedZoneProps) {
  try {
    // Filter for at-risk clients from the provided data
    const atRiskClients = clientsData.filter(client => client.risk_status === 'at-risk');

    if (atRiskClients.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">The &ldquo;Red Zone&rdquo; (Priority 1)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No clients currently at risk.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600">The &ldquo;Red Zone&rdquo; (Priority 1)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Clients with current or predictive score ≤ 2
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {atRiskClients.map((client) => (
              <div key={client.id} className="border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{client.name}</h3>
                    {client.industry && (
                      <Badge variant="secondary" className="mt-1 text-xs">{client.industry}</Badge>
                    )}
                  </div>
                  <div className="text-right sm:text-left">
                    <div className="text-sm text-muted-foreground">Coach: {client.coach_name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatWeekDate(client.week_of)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className={`flex-1 px-3 py-2 rounded-full text-sm font-medium text-center ${getScoreColor(client.current_score)}`}>
                    Current: {client.current_score}/5
                  </div>
                  <div className={`flex-1 px-3 py-2 rounded-full text-sm font-medium text-center ${getScoreColor(client.predictive_score)}`}>
                    Predictive: {client.predictive_score}/5
                  </div>
                </div>

                {client.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes:</h4>
                    <p className="text-sm">{client.notes}</p>
                  </div>
                )}

                {client.action_items && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Action Items:</h4>
                    <p className="text-sm text-red-700 dark:text-red-300">{client.action_items}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  } catch {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600">The &ldquo;Red Zone&rdquo; (Priority 1)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600">
            <p>Error loading at-risk clients</p>
          </div>
        </CardContent>
      </Card>
    );
  }
}