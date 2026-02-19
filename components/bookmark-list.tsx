'use client';

import { BookmarkCard } from '@/components/bookmark-card';
import { type Bookmark } from '@/lib/types';
import { Empty } from '@/components/ui/empty';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onDelete: (id: string) => Promise<void>;
}

export function BookmarkList({ bookmarks, onDelete }: BookmarkListProps) {
  if (bookmarks.length === 0) {
    return (
      <Empty
        icon="📚"
        title="No bookmarks yet"
        description="Start by adding your first bookmark using the form above"
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          onDelete={() => onDelete(bookmark.id)}
        />
      ))}
    </div>
  );
}
