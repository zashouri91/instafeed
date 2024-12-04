'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { addDays } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { DateRange } from 'react-day-picker';

interface Survey {
  id: string;
  title: string;
  description: string;
  group_id: string;
  start_date: string;
  end_date: string;
  created_at: string;
  status: string;
}

interface Group {
  id: string;
  name: string;
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const { toast } = useToast();

  const fetchSurveys = async () => {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error fetching surveys',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setSurveys(data || []);
  };

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('id, name')
      .order('name');

    if (error) {
      toast({
        title: 'Error fetching groups',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setGroups(data || []);
  };

  useEffect(() => {
    fetchSurveys();
    fetchGroups();
  }, []);

  const handleCreateOrUpdateSurvey = async () => {
    if (!title.trim() || !groupId || !dateRange?.from || !dateRange?.to) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const surveyData = {
      title,
      description,
      group_id: groupId,
      start_date: dateRange.from.toISOString(),
      end_date: dateRange.to.toISOString(),
      status: 'draft',
    };

    if (editingSurvey) {
      const { error } = await supabase
        .from('surveys')
        .update(surveyData)
        .eq('id', editingSurvey.id);

      if (error) {
        toast({
          title: 'Error updating survey',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Survey updated successfully',
      });
    } else {
      const { error } = await supabase
        .from('surveys')
        .insert([surveyData]);

      if (error) {
        toast({
          title: 'Error creating survey',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Survey created successfully',
      });
    }

    resetForm();
    fetchSurveys();
  };

  const handleDeleteSurvey = async (surveyId: string) => {
    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', surveyId);

    if (error) {
      toast({
        title: 'Error deleting survey',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Survey deleted successfully',
    });

    fetchSurveys();
  };

  const handlePublishSurvey = async (surveyId: string) => {
    const { error } = await supabase
      .from('surveys')
      .update({ status: 'active' })
      .eq('id', surveyId);

    if (error) {
      toast({
        title: 'Error publishing survey',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Survey published successfully',
    });

    fetchSurveys();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setGroupId('');
    setDateRange({
      from: new Date(),
      to: addDays(new Date(), 7),
    });
    setEditingSurvey(null);
    setIsOpen(false);
  };

  const openEditDialog = (survey: Survey) => {
    setEditingSurvey(survey);
    setTitle(survey.title);
    setDescription(survey.description);
    setGroupId(survey.group_id);
    setDateRange({
      from: new Date(survey.start_date),
      to: new Date(survey.end_date),
    });
    setIsOpen(true);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Surveys</h1>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>Create New Survey</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingSurvey ? 'Edit Survey' : 'Create New Survey'}</DialogTitle>
              <DialogDescription>
                {editingSurvey ? 'Edit your survey details.' : 'Create a new survey for your group.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter survey title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter survey description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="group">Group</Label>
                <Select value={groupId} onValueChange={setGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Date Range</Label>
                <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrUpdateSurvey}>
                {editingSurvey ? 'Update Survey' : 'Create Survey'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {surveys.map((survey) => (
          <Card key={survey.id}>
            <CardHeader>
              <CardTitle>{survey.title}</CardTitle>
              <CardDescription>
                Created on {new Date(survey.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">{survey.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Start Date:</span>
                  <span>{new Date(survey.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>End Date:</span>
                  <span>{new Date(survey.end_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <span className="capitalize">{survey.status}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => openEditDialog(survey)}
                >
                  Edit
                </Button>
                {survey.status === 'draft' && (
                  <Button
                    variant="outline"
                    onClick={() => handlePublishSurvey(survey.id)}
                  >
                    Publish
                  </Button>
                )}
              </div>
              <Button
                variant="destructive"
                onClick={() => handleDeleteSurvey(survey.id)}
              >
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}