import { Card } from '@/components/ui/card';

export function DashboardOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-6">
        <h3 className="font-semibold text-sm text-muted-foreground">
          Total Surveys
        </h3>
        <p className="text-2xl font-bold">0</p>
      </Card>
      <Card className="p-6">
        <h3 className="font-semibold text-sm text-muted-foreground">
          Active Surveys
        </h3>
        <p className="text-2xl font-bold">0</p>
      </Card>
      <Card className="p-6">
        <h3 className="font-semibold text-sm text-muted-foreground">
          Total Responses
        </h3>
        <p className="text-2xl font-bold">0</p>
      </Card>
      <Card className="p-6">
        <h3 className="font-semibold text-sm text-muted-foreground">
          Response Rate
        </h3>
        <p className="text-2xl font-bold">0%</p>
      </Card>
    </div>
  );
}