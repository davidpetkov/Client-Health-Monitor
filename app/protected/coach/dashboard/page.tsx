import { Button } from "@/components/ui/button";
import { ClientList } from "@/components/coach/client-list";

export default function CoachDashboard() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Coach Dashboard</h1>
        <Button variant="outline">Add New Client</Button>
      </div>

      <ClientList />
    </div>
  );
}