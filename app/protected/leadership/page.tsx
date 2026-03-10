"use client";

import { ExecutiveSummary } from "@/components/leadership/executive-summary";
import { RedZone } from "@/components/leadership/red-zone";
import { AllAccountsTable } from "@/components/leadership/all-accounts-table";
import { createClient } from "@/lib/supabase/client";
import { Suspense, useEffect, useState } from "react";

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

function DashboardContent() {
  const [allClients, setAllClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllClients = async () => {
      try {
        const supabase = createClient();
        
        // Get leadership user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error("User not authenticated");
        }

        // Check if user has leadership role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || !profile || profile.role !== 'leadership') {
          throw new Error("Unauthorized access");
        }

        // Get all clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select(`
            id,
            name,
            industry,
            coach_id
          `);

        if (clientsError) {
          throw new Error("Failed to fetch clients");
        }

        // Get unique coach IDs
        const coachIds = [...new Set(clientsData?.map(client => client.coach_id) || [])];

        // Get coach names
        let coachNames: Record<string, string> = {};
        if (coachIds.length > 0) {
          const { data: coachesData, error: coachesError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', coachIds);

          if (coachesError) {
            throw new Error("Failed to fetch coach names");
          }

          coachNames = coachesData?.reduce((acc, coach) => {
            acc[coach.id] = coach.full_name;
            return acc;
          }, {} as Record<string, string>) || {};
        }

        // Get all health checkins for these clients
        const clientIds = clientsData?.map(client => client.id) || [];
        
        if (clientIds.length === 0) {
          setAllClients([]);
          setLoading(false);
          return;
        }

        const { data: checkinsData, error: checkinsError } = await supabase
          .from('health_checkins')
          .select(`
            client_id,
            current_score,
            predictive_score,
            week_of,
            notes,
            action_items,
            created_at
          `)
          .in('client_id', clientIds)
          .order('created_at', { ascending: false });

        if (checkinsError) {
          throw new Error("Failed to fetch health checkins");
        }

        // Helper function to get the latest checkin for each client
        function getLatestCheckins(checkins: Array<{
          client_id: string;
          created_at: string;
          [key: string]: unknown;
        }>) {
          const latestCheckins = new Map();
          
          checkins.forEach((checkin: { client_id: string; created_at: string }) => {
            const existingCheckin = latestCheckins.get(checkin.client_id);
            
            if (!existingCheckin) {
              latestCheckins.set(checkin.client_id, checkin);
            } else {
              const existingDate = new Date(existingCheckin.created_at);
              const newDate = new Date(checkin.created_at);
              
              if (newDate > existingDate) {
                latestCheckins.set(checkin.client_id, checkin);
              }
            }
          });
          
          return latestCheckins;
        }

        // Get the latest checkin for each client
        const clientCheckins = getLatestCheckins(checkinsData || []);

        // Format all client data
        const formattedClients: ClientData[] = [];
        
        clientsData?.forEach((client: {
          id: string;
          name: string;
          industry: string | null;
          coach_id: string;
        }) => {
          const checkin = clientCheckins.get(client.id);
          if (checkin) {
            let risk_status: 'healthy' | 'needs-attention' | 'at-risk' = 'healthy';
            
            // Use the most recent checkin data
            const currentScore = checkin.current_score || 0;
            const predictiveScore = checkin.predictive_score || 0;
            
            if (currentScore <= 2 || predictiveScore <= 2) {
              risk_status = 'at-risk';
            } else if (predictiveScore < 5) {
              risk_status = 'needs-attention';
            }

            formattedClients.push({
              id: client.id,
              name: client.name,
              industry: client.industry,
              coach_name: coachNames[client.coach_id] || 'Unknown',
              current_score: currentScore,
              predictive_score: predictiveScore,
              week_of: checkin.week_of,
              notes: checkin.notes,
              action_items: checkin.action_items,
              risk_status
            });
          } else {
            // Client with no checkins - mark as needs attention
            formattedClients.push({
              id: client.id,
              name: client.name,
              industry: client.industry,
              coach_name: coachNames[client.coach_id] || 'Unknown',
              current_score: 0,
              predictive_score: 0,
              week_of: new Date().toISOString().split('T')[0],
              notes: null,
              action_items: null,
              risk_status: 'needs-attention'
            });
          }
        });

        setAllClients(formattedClients);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllClients();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Leadership Dashboard</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Leadership Dashboard</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const nonAtRiskClients = allClients.filter(client => client.risk_status !== 'at-risk');

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Leadership Dashboard</h1>
      </div>
      
      <ExecutiveSummary clientsData={allClients} />
      
      <RedZone clientsData={allClients} />
      
      <AllAccountsTable clients={nonAtRiskClients} />
    </div>
  );
}

export default function LeadershipDashboard() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Leadership Dashboard</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}