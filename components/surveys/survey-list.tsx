import { Survey } from '@/lib/supabase/types';
import { Card } from '@/components/ui/card';
import { formatDistance } from 'date-fns';

interface SurveyListProps {
  surveys: Survey[];
}

export function SurveyList({ surveys }: SurveyListProps) {
  if (surveys.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No surveys found.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Create your first survey to get started.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {surveys.map((survey) => (
        <Card key={survey.id} className="p-6">
          <h3 className="font-semibold mb-2">{survey.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {survey.description}
          </p>
          <div className="text-xs text-muted-foreground">
            Created{' '}
            {formatDistance(new Date(survey.createdAt), new Date(), {
              addSuffix: true,
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}