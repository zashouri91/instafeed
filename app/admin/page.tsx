'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const { toast } = useToast();

  const makeAdmin = async () => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set admin role');
      }

      toast({
        title: 'Success',
        description: 'You are now an admin!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">Admin Setup</h1>
      <div className="space-y-4">
        <p className="text-gray-600">
          Click the button below to make yourself an admin. This will give you full access to all features.
        </p>
        <Button onClick={makeAdmin}>
          Make Me Admin
        </Button>
      </div>
    </div>
  );
}
