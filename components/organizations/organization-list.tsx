import { Organization } from '@/lib/supabase/types';
import { Card } from '@/components/ui/card';
import { formatDistance } from 'date-fns';

interface OrganizationListProps {
  organizations: Organization[];
}

export function OrganizationList({ organizations }: OrganizationListProps) {
  if (organizations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No organizations found.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Create your first organization to get started.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {organizations.map((org) => (
        <Card key={org.id} className="p-6">
          <h3 className="font-semibold mb-2">{org.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {org.description}
          </p>
          <div className="text-xs text-muted-foreground">
            Created{' '}
            {formatDistance(new Date(org.createdAt), new Date(), {
              addSuffix: true,
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}