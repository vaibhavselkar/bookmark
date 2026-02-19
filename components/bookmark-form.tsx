'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type Bookmark } from '@/lib/types';

const bookmarkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  url: z.string().url('Must be a valid URL'),
  description: z.string().optional(),
  tags: z.string().optional(),
});

type BookmarkInput = z.infer<typeof bookmarkSchema>;

interface BookmarkFormProps {
  onAdd: (bookmark: Omit<Bookmark, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export function BookmarkForm({ onAdd }: BookmarkFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookmarkInput>({
    resolver: zodResolver(bookmarkSchema),
  });

  const onSubmit = async (data: BookmarkInput) => {
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await onAdd({
        title: data.title,
        url: data.url,
        description: data.description || null,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      });

      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add bookmark');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Bookmark</CardTitle>
        <CardDescription>Save a new bookmark to your collection</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              Bookmark added successfully!
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Bookmark title"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                {...register('url')}
              />
              {errors.url && (
                <p className="text-sm text-red-600">{errors.url.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add a description (optional)"
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="e.g. programming, tutorial, design"
              {...register('tags')}
            />
            {errors.tags && (
              <p className="text-sm text-red-600">{errors.tags.message}</p>
            )}
          </div>

          <Button type="submit" disabled={submitting} className="w-full md:w-auto">
            {submitting ? 'Adding...' : 'Add Bookmark'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
