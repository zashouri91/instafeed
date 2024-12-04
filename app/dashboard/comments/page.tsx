'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '@/components/ui/card';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchComments() {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
      } else {
        setComments(data || []);
      }
      setLoading(false);
    }

    fetchComments();
  }, []);

  if (loading) {
    return <div>Loading comments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Comments</h1>
      </div>

      <div className="grid gap-4">
        {comments.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No comments yet.
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <p className="text-muted-foreground">{comment.content}</p>
              <div className="mt-2 text-sm text-muted-foreground">
                Posted on {new Date(comment.created_at).toLocaleDateString()}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
