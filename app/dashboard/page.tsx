'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { BookmarkForm } from '@/components/bookmark-form';
import { BookmarkList } from '@/components/bookmark-list';
import { type Bookmark } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DashboardPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setBookmarks(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('bookmarks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
        },
        () => {
          fetchBookmarks();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, router]);

  const handleAddBookmark = async (bookmark: Omit<Bookmark, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in');
        return;
      }

      const { error } = await supabase.from('bookmarks').insert({
        ...bookmark,
        user_id: user.id,
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add bookmark');
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    try {
      const { error } = await supabase.from('bookmarks').delete().eq('id', id);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bookmark');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <BookmarkForm onAdd={handleAddBookmark} />

          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Loading bookmarks...</p>
            </div>
          ) : (
            <BookmarkList bookmarks={bookmarks} onDelete={handleDeleteBookmark} />
          )}
        </div>
      </main>
    </div>
  );
}
