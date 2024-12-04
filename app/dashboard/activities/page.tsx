'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';

interface Activity {
  id: string;
  user: {
    email: string;
  };
  group: {
    name: string;
  };
  status: {
    name: string;
    color: string;
  };
  description: string;
  start_time: string;
  end_time: string | null;
  created_at: string;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const { toast } = useToast();

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        user:user_id(email),
        group:group_id(name),
        status:status_id(name, color)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error fetching activities',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setActivities(data || []);
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Activity Log</h1>
        <Button onClick={fetchActivities}>Refresh</Button>
      </div>

      <div className="grid gap-4">
        {activities.map((activity) => (
          <Card key={activity.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{activity.user.email}</CardTitle>
                  <CardDescription>
                    {new Date(activity.created_at).toLocaleString()}
                  </CardDescription>
                </div>
                <span
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${activity.status.color}20`,
                    color: activity.status.color,
                  }}
                >
                  {activity.status.name}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">{activity.description}</p>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>Group: {activity.group.name}</span>
                  <span>•</span>
                  <span>
                    Duration:{' '}
                    {activity.end_time
                      ? new Date(activity.end_time).toLocaleTimeString()
                      : 'Ongoing'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
