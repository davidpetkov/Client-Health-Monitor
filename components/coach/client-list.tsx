"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ClientRow } from "@/components/coach/client-row";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface Client {
  id: string;
  name: string;
  industry: string | null;
  health_checkins: {
    week_of: string;
    current_score: number;
    predictive_score: number;
  }[];
  coaching_status: {
    current_week_checkin: boolean;
    previous_week_checkin: boolean;
    days_since_last_checkin: number;
    priority_level: 'high' | 'medium' | 'low';
    trend_direction: 'improving' | 'declining' | 'stable' | 'none';
    needs_attention: boolean;
    score_change: number;
  };
}

interface RawClient {
  id: string;
  name: string;
  industry: string | null;
  health_checkins: {
    week_of: string;
    current_score: number;
    predictive_score: number;
    created_at: string;
  }[];
}

function getFridayForDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day >= 5 ? 0 : -(day + 2);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

function calculateCoachingStatus(client: RawClient): Client['coaching_status'] {
  const currentWeekFriday = getFridayForDate(new Date());

  const previousFriday = new Date();
  previousFriday.setDate(previousFriday.getDate() - 7);
  const previousWeekFriday = getFridayForDate(previousFriday);

  const sorted = [...client.health_checkins].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const currentWeekCheckin = sorted.some(c => {
    const checkinDate = new Date(c.created_at);
    const checkinWeekFriday = getFridayForDate(checkinDate);
    return checkinWeekFriday === currentWeekFriday;
  });

  const previousWeekCheckin = sorted.some(c => {
    const checkinDate = new Date(c.created_at);
    const checkinWeekFriday = getFridayForDate(checkinDate);
    return checkinWeekFriday === previousWeekFriday;
  });

  const latest = sorted[0];
  const previous = sorted[1];

  let daysSinceLast = 999;
  if (latest) {
    daysSinceLast = Math.floor(
      (new Date().getTime() - new Date(latest.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  const priority = latest
    ? latest.predictive_score < 3 ? 'high' as const
    : latest.predictive_score < 5 ? 'medium' as const
    : 'low' as const
    : 'high' as const;

  let trendDirection: Client['coaching_status']['trend_direction'] = 'none';
  let scoreChange = 0;

  if (latest && previous) {
    scoreChange = latest.predictive_score - previous.predictive_score;
    if (scoreChange > 0) trendDirection = 'improving';
    else if (scoreChange < 0) trendDirection = 'declining';
    else trendDirection = 'stable';
  }

  const needs_attention = !currentWeekCheckin || daysSinceLast > 14 || priority === 'high';

  return {
    current_week_checkin: currentWeekCheckin,
    previous_week_checkin: previousWeekCheckin,
    days_since_last_checkin: daysSinceLast,
    priority_level: priority,
    trend_direction: trendDirection,
    needs_attention,
    score_change: scoreChange,
  };
}

function sortClients(clients: Client[]): Client[] {
  return [...clients].sort((a, b) => {
    if (a.coaching_status.needs_attention !== b.coaching_status.needs_attention) {
      return a.coaching_status.needs_attention ? -1 : 1;
    }

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.coaching_status.priority_level];
    const bPriority = priorityOrder[b.coaching_status.priority_level];

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    return a.coaching_status.days_since_last_checkin - b.coaching_status.days_since_last_checkin;
  });
}

export function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setError('You must be logged in to view clients');
          setLoading(false);
          return;
        }

        const { data: clientsData, error: fetchError } = await supabase
          .from('clients')
          .select(`
            id,
            name,
            industry,
            health_checkins (
              week_of,
              current_score,
              predictive_score,
              created_at
            )
          `)
          .eq('coach_id', user.id)
          .order('name');

        if (fetchError) {
          console.error('Error fetching clients:', fetchError);
          setError('Failed to load clients');
          return;
        }

        const enriched = (clientsData || []).map((raw: RawClient) => ({
          ...raw,
          coaching_status: calculateCoachingStatus(raw),
        }));

        setClients(sortClients(enriched));
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading clients...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No clients assigned</h3>
            <p className="text-muted-foreground">
              You don&apos;t have any clients assigned yet. Contact your administrator to get clients assigned to you.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {clients.map((client) => (
        <ClientRow key={client.id} client={client} />
      ))}
    </div>
  );
}