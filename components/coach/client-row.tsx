"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle, AlertCircle, Clock, TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";

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

interface ClientRowProps {
  client: Client;
}

function StatusBadge({ status }: { status: Client['coaching_status'] }) {
  if (status.days_since_last_checkin < 0) {
    return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Future</Badge>;
  }
  if (status.days_since_last_checkin > 14) {
    return <Badge variant="destructive">Overdue</Badge>;
  }
  if (!status.current_week_checkin && status.previous_week_checkin) {
    return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Due Soon</Badge>;
  }
  if (status.priority_level === 'high') {
    return <Badge variant="destructive">High Priority</Badge>;
  }
  if (status.priority_level === 'medium') {
    return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Monitor</Badge>;
  }
  return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Current</Badge>;
}

function TrendIcon({ trend, scoreChange }: { trend: Client['coaching_status']['trend_direction']; scoreChange: number }) {
  if (trend === 'improving') {
    return (
      <span className="flex items-center gap-1 text-emerald-600">
        <TrendingUp className="h-4 w-4" />
        <span className="text-xs font-medium">+{scoreChange}</span>
      </span>
    );
  }
  if (trend === 'declining') {
    return (
      <span className="flex items-center gap-1 text-red-600">
        <TrendingDown className="h-4 w-4" />
        <span className="text-xs font-medium">{scoreChange}</span>
      </span>
    );
  }
  if (trend === 'stable') {
    return (
      <span className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-4 w-4" />
        <span className="text-xs font-medium">0</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      <Calendar className="h-4 w-4" />
      <span className="text-xs font-medium">New</span>
    </span>
  );
}

function DaysSinceLabel({ days }: { days: number }) {
  if (days < 0) {
    return <span className="text-blue-600 font-medium">{Math.abs(days)}d in future</span>;
  }
  if (days > 14) {
    return <span className="text-red-600 font-medium">{days}d ago</span>;
  }
  if (days > 7) {
    return <span className="text-amber-600 font-medium">{days}d ago</span>;
  }
  if (days <= 7) {
    return <span className="text-emerald-600 font-medium">{days}d ago</span>;
  }
  return <span className="text-muted-foreground">Never</span>;
}

export function ClientRow({ client }: ClientRowProps) {
  const [currentScore, setCurrentScore] = useState('');
  const [predictiveScore, setPredictiveScore] = useState('');
  const [notes, setNotes] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const getRecentScore = () => {
    if (client.health_checkins.length === 0) {
      return { current: null, predictive: null };
    }

    const latest = client.health_checkins.sort((a, b) =>
      new Date(b.week_of).getTime() - new Date(a.week_of).getTime()
    )[0];

    return { current: latest.current_score, predictive: latest.predictive_score };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage('You must be logged in to submit scores');
        setSubmitStatus('error');
        return;
      }

      const weekOf = new Date();
      weekOf.setDate(weekOf.getDate() - weekOf.getDay() + 5);
      weekOf.setHours(0, 0, 0, 0);

      const currentScoreNum = parseInt(currentScore);
      const predictiveScoreNum = parseInt(predictiveScore);

      if (isNaN(currentScoreNum) || isNaN(predictiveScoreNum)) {
        setErrorMessage('Scores must be valid numbers');
        setSubmitStatus('error');
        return;
      }

      if (currentScoreNum < 1 || currentScoreNum > 5 || predictiveScoreNum < 1 || predictiveScoreNum > 5) {
        setErrorMessage('Scores must be between 1 and 5');
        setSubmitStatus('error');
        return;
      }

      const { error } = await supabase.from('health_checkins').insert({
        client_id: client.id,
        coach_id: user.id,
        week_of: weekOf.toISOString().split('T')[0],
        current_score: currentScoreNum,
        predictive_score: predictiveScoreNum,
        notes: notes || null,
        action_items: predictiveScoreNum < 5 ? actionItems : null
      });

      if (error) {
        if (error.code === '23505') {
          setErrorMessage('A check-in for this week already exists for this client');
        } else {
          setErrorMessage(error.message || 'Failed to submit check-in');
        }
        setSubmitStatus('error');
        return;
      }

      setSubmitStatus('success');
      setCurrentScore('');
      setPredictiveScore('');
      setNotes('');
      setActionItems('');

      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      setErrorMessage('An unexpected error occurred');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { current: recentCurrent, predictive: recentPredictive } = getRecentScore();
  const { coaching_status } = client;

  return (
    <Card className={coaching_status.needs_attention ? 'border-red-300 dark:border-red-800' : ''}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <span>{client.name}</span>
            <div className="flex items-center gap-2">
              <StatusBadge status={coaching_status} />
              <DaysSinceLabel days={coaching_status.days_since_last_checkin} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {client.industry && (
              <Badge variant="secondary">{client.industry}</Badge>
            )}
            <TrendIcon trend={coaching_status.trend_direction} scoreChange={coaching_status.score_change} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentCurrent !== null && (
          <div className="bg-muted p-3 rounded-md">
            <h4 className="text-sm font-medium mb-2">Recent Scores</h4>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Current: </span>
                <span className="font-medium">{recentCurrent}/5</span>
              </div>
              <div>
                <span className="text-muted-foreground">Predictive: </span>
                <span className="font-medium">{recentPredictive}/5</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="current-score">Current Score (1-5)</Label>
              <Input
                id="current-score"
                type="number"
                min="1"
                max="5"
                value={currentScore}
                onChange={(e) => setCurrentScore(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="predictive-score">Predictive Score (1-5)</Label>
              <Input
                id="predictive-score"
                type="number"
                min="1"
                max="5"
                value={predictiveScore}
                onChange={(e) => setPredictiveScore(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
              placeholder="Optional observations..."
            />
          </div>

          {parseInt(predictiveScore) < 5 && (
            <div>
              <Label htmlFor="action-items">Action Items (required)</Label>
              <textarea
                id="action-items"
                className="w-full mt-1 p-2 border rounded-md"
                value={actionItems}
                onChange={(e) => setActionItems(e.target.value)}
                required
                rows={3}
                placeholder="Required when predictive score is less than 5..."
              />
            </div>
          )}

          {submitStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              Check-in submitted successfully!
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Check-in'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}