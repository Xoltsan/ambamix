import React, { createContext, useContext, useState, useEffect } from 'react';

const BookmarkContext = createContext();

export function BookmarkProvider({ children }) {
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('ambamix_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('ambamix_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ambamix_bookmarks', JSON.stringify(bookmarks));
    } catch (e) {
      console.error('Failed to save bookmarks', e);
    }
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem('ambamix_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }, [history]);

  const isBookmarked = (slug) => {
    return bookmarks.some((item) => item.slug === slug);
  };

  const toggleBookmark = (comic) => {
    if (!comic || !comic.slug) return;
    setBookmarks((prev) => {
      const exists = prev.some((item) => item.slug === comic.slug);
      if (exists) {
        return prev.filter((item) => item.slug !== comic.slug);
      }
      return [
        {
          slug: comic.slug,
          title: comic.title,
          thumbnail: comic.thumbnail,
          type: comic.type || 'Manga',
          author: comic.author || '',
          addedAt: new Date().toISOString()
        },
        ...prev
      ];
    });
  };

  const recordHistory = ({ comicSlug, comicTitle, thumbnail, type, chapterSlug, chapterTitle }) => {
    if (!comicSlug || !chapterSlug) return;
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.comicSlug !== comicSlug);
      return [
        {
          comicSlug,
          comicTitle: comicTitle || comicSlug,
          thumbnail: thumbnail || '',
          type: type || 'Manga',
          chapterSlug,
          chapterTitle: chapterTitle || chapterSlug,
          readAt: new Date().toISOString()
        },
        ...filtered
      ].slice(0, 100); // keep up to 100 recent entries
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const removeHistoryItem = (comicSlug) => {
    setHistory((prev) => prev.filter((item) => item.comicSlug !== comicSlug));
  };

  return (
    <BookmarkContext.Provider
      value={{
        bookmarks,
        history,
        isBookmarked,
        toggleBookmark,
        recordHistory,
        clearHistory,
        removeHistoryItem
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmarks must be used within BookmarkProvider');
  }
  return context;
}
