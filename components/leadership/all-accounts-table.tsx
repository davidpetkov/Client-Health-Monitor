"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

function truncateText(text: string | null, maxLength: number = 50): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

export function AllAccountsTable({ clients }: { clients: ClientData[] }) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ClientData;
    direction: 'ascending' | 'descending';
  }>({
    key: 'name',
    direction: 'ascending'
  });
  
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const sortedClients = useMemo(() => {
    const sortableClients = [...clients];
    if (sortConfig.key) {
      sortableClients.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'ascending' ? 1 : -1;
        if (bValue == null) return sortConfig.direction === 'ascending' ? -1 : 1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableClients;
  }, [clients, sortConfig]);

  const requestSort = (key: keyof ClientData) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setMobileSortOpen(false);
  };

  const getSortIcon = (key: keyof ClientData) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortConfig.direction === 'ascending' 
      ? <ChevronUp className="h-4 w-4" /> 
      : <ChevronDown className="h-4 w-4" />;
  };

  const toggleCardExpansion = (clientId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId);
    } else {
      newExpanded.add(clientId);
    }
    setExpandedCards(newExpanded);
  };

  const getSortLabel = (key: keyof ClientData) => {
    switch (key) {
      case 'name': return 'Client Name';
      case 'industry': return 'Industry';
      case 'coach_name': return 'Coach';
      case 'current_score': return 'Current Score';
      case 'predictive_score': return 'Predictive Score';
      case 'week_of': return 'Week Of';
      default: return key;
    }
  };

  const MobileClientCard = ({ client }: { client: ClientData }) => (
    <Card className="mb-4 border rounded-lg overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{client.name}</h3>
              {client.industry && (
                <Badge variant="secondary" className="text-xs">
                  {client.industry}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Coach: {client.coach_name}</span>
              <span>•</span>
              <span>{formatWeekDate(client.week_of)}</span>
            </div>
          </div>
          <DropdownMenu open={mobileSortOpen} onOpenChange={setMobileSortOpen}>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-muted rounded-md" aria-label="Sort options">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => requestSort('name')}>
                Sort by {getSortLabel('name')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => requestSort('industry')}>
                Sort by {getSortLabel('industry')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => requestSort('coach_name')}>
                Sort by {getSortLabel('coach_name')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => requestSort('current_score')}>
                Sort by {getSortLabel('current_score')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => requestSort('predictive_score')}>
                Sort by {getSortLabel('predictive_score')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => requestSort('week_of')}>
                Sort by {getSortLabel('week_of')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex gap-3 mb-3">
          <div className={`flex-1 px-3 py-2 rounded-full text-sm font-medium text-center ${getScoreColor(client.current_score)}`}>
            Current: {client.current_score}/5
          </div>
          <div className={`flex-1 px-3 py-2 rounded-full text-sm font-medium text-center ${getScoreColor(client.predictive_score)}`}>
            Predictive: {client.predictive_score}/5
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm font-medium">Notes</div>
          <button
            onClick={() => toggleCardExpansion(client.id)}
            className="text-sm text-primary hover:underline"
          >
            {expandedCards.has(client.id) ? 'Show Less' : 'Show More'}
          </button>
        </div>
        
        {expandedCards.has(client.id) && client.notes && (
          <div className="mb-3 p-3 bg-muted rounded-md">
            <p className="text-sm">{client.notes}</p>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium">Status</div>
          {client.risk_status === 'needs-attention' ? (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-sm">
              Needs Attention
            </Badge>
          ) : (
            <Badge className="bg-green-500 hover:bg-green-600 text-white text-sm">
              Healthy
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (clients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Accounts (Priority 2)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No clients to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Accounts (Priority 2)</CardTitle>
        <p className="text-sm text-muted-foreground">
          All clients not in the Red Zone
        </p>
      </CardHeader>
      <CardContent>
        {/* Mobile Card View */}
        <div className="md:hidden">
          {sortedClients.map((client) => (
            <MobileClientCard key={client.id} client={client} />
          ))}
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th 
                    className="text-left p-2 cursor-pointer hover:bg-muted/50"
                    onClick={() => requestSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Client Name {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-2 cursor-pointer hover:bg-muted/50"
                    onClick={() => requestSort('industry')}
                  >
                    <div className="flex items-center gap-1">
                      Industry {getSortIcon('industry')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-2 cursor-pointer hover:bg-muted/50"
                    onClick={() => requestSort('coach_name')}
                  >
                    <div className="flex items-center gap-1">
                      Coach {getSortIcon('coach_name')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-2 cursor-pointer hover:bg-muted/50"
                    onClick={() => requestSort('current_score')}
                  >
                    <div className="flex items-center gap-1">
                      Current {getSortIcon('current_score')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-2 cursor-pointer hover:bg-muted/50"
                    onClick={() => requestSort('predictive_score')}
                  >
                    <div className="flex items-center gap-1">
                      Predictive {getSortIcon('predictive_score')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-2 cursor-pointer hover:bg-muted/50"
                    onClick={() => requestSort('week_of')}
                  >
                    <div className="flex items-center gap-1">
                      Week Of {getSortIcon('week_of')}
                    </div>
                  </th>
                  <th className="text-left p-2">Notes</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedClients.map((client) => (
                  <tr key={client.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{client.name}</td>
                    <td className="p-2">
                      {client.industry ? (
                        <Badge variant="secondary">{client.industry}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-2">{client.coach_name}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(client.current_score)}`}>
                        {client.current_score}/5
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(client.predictive_score)}`}>
                        {client.predictive_score}/5
                      </span>
                    </td>
                    <td className="p-2 text-muted-foreground">
                      {formatWeekDate(client.week_of)}
                    </td>
                    <td className="p-2 max-w-xs">
                      {truncateText(client.notes)}
                    </td>
                    <td className="p-2">
                      {client.risk_status === 'needs-attention' ? (
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                          Needs Attention
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white">
                          Healthy
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}