'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { BookmarkForm } from '@/components/bookmark-form';
import { BookmarkList } from '@/components/bookmark-list';
import { type Bookmark } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const dynamic = 'force-dynamic';

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

    // Realtime subscription
    const channel = supabase
      .channel('bookmarks-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookmarks' },
        (payload) => {
          setBookmarks((prev) => {
            // Avoid duplicates if optimistic update already added it
            const exists = prev.some((b) => b.id === payload.new.id);
            if (exists) return prev;
            return [payload.new as Bookmark, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'bookmarks' },
        (payload) => {
          setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookmarks' },
        (payload) => {
          setBookmarks((prev) =>
            prev.map((b) => (b.id === payload.new.id ? (payload.new as Bookmark) : b))
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [router]);

  const handleAddBookmark = async (
    bookmark: Omit<Bookmark, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in');
        return;
      }

      const { data, error } = await supabase
        .from('bookmarks')
        .insert({ ...bookmark, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      // Optimistic update — add to top immediately
      setBookmarks((prev) => [data, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add bookmark');
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    try {
      // Optimistic update — remove immediately
      setBookmarks((prev) => prev.filter((b) => b.id !== id));

      const { error } = await supabase.from('bookmarks').delete().eq('id', id);

      if (error) {
        // Revert if delete failed by refetching
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('bookmarks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          setBookmarks(data || []);
        }
        throw error;
      }
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
          ) : bookmarks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">No bookmarks yet.</p>
              <p className="text-slate-400 text-sm mt-1">Add your first bookmark above!</p>
            </div>
          ) : (
            <BookmarkList bookmarks={bookmarks} onDelete={handleDeleteBookmark} />
          )}
        </div>
      </main>
    </div>
  );
}