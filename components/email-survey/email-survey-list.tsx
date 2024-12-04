"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Copy, ExternalLink, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/hooks/use-toast";

interface EmailSurvey {
  id: string;
  title: string;
  associate_name: string;
  created_at: string;
  icon_type: string;
}

interface EmailSurveyListProps {
  surveys: EmailSurvey[];
}

export function EmailSurveyList({ surveys }: EmailSurveyListProps) {
  const [items, setItems] = useState(surveys);
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const handleCopyCode = (id: string) => {
    const code = `<iframe src="${window.location.origin}/surveys/${id}" width="500" height="200" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Survey code copied to clipboard",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("email_surveys")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setItems((prev) => prev.filter((item) => item.id !== id));
      toast({
        title: "Success",
        description: "Survey deleted successfully",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to delete survey",
        variant: "destructive",
      });
    }
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-40">
          <p className="text-muted-foreground">No surveys created yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((survey) => (
        <Card key={survey.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {survey.title}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleCopyCode(survey.id)}
                  className="cursor-pointer"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Code
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.open(`/surveys/${survey.id}`, "_blank")}
                  className="cursor-pointer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(survey.id)}
                  className="cursor-pointer text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Created for {survey.associate_name}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(survey.created_at), {
                addSuffix: true,
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
