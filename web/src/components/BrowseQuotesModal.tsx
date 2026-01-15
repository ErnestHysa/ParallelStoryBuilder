'use client';

import React, { useState, useCallback } from 'react';
import { X, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { extractMultipleQuotes, stripHtmlTags } from '@/lib/cardGenerator';

interface Chapter {
  id: string;
  content: string;
  ai_enhanced_content?: string | null;
  chapter_number: number;
  author_id: string;
  created_at: string;
}

interface BrowseQuotesModalProps {
  open: boolean;
  onClose: () => void;
  chapters: Chapter[];
  onSelectQuote: (quote: string, chapterNumber: number) => void;
  currentQuote?: string;
}

export function BrowseQuotesModal({
  open,
  onClose,
  chapters,
  onSelectQuote,
  currentQuote,
}: BrowseQuotesModalProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());

  // Sort chapters by number
  const sortedChapters = [...chapters].sort((a, b) => a.chapter_number - b.chapter_number);

  // Toggle chapter expansion
  const toggleChapter = useCallback((chapterNumber: number) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterNumber)) {
        newSet.delete(chapterNumber);
      } else {
        newSet.add(chapterNumber);
      }
      return newSet;
    });
  }, []);

  // Get quotes for a chapter
  const getChapterQuotes = useCallback((chapter: Chapter) => {
    return extractMultipleQuotes(chapter, 3);
  }, []);

  // Handle quote selection
  const handleSelectQuote = useCallback((quote: string, chapterNumber: number) => {
    onSelectQuote(quote, chapterNumber);
    onClose();
  }, [onSelectQuote, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Select a Quote</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sortedChapters.map((chapter) => {
            const quotes = getChapterQuotes(chapter);
            const isExpanded = expandedChapters.has(chapter.chapter_number);
            const isSelected = quotes.some(q => q === currentQuote);

            return (
              <div
                key={chapter.id}
                className={`border rounded-xl overflow-hidden transition-all ${
                  isSelected ? 'border-pink-300 bg-pink-50/50' : 'border-gray-200'
                }`}
              >
                {/* Chapter header */}
                <button
                  onClick={() => toggleChapter(chapter.chapter_number)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isSelected
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {chapter.chapter_number}
                    </div>
                    <span className="font-medium text-gray-900">
                      Chapter {chapter.chapter_number}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Quote previews */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    {quotes.map((quote, index) => {
                      const isQuoteSelected = quote === currentQuote;
                      return (
                        <button
                          key={index}
                          onClick={() => handleSelectQuote(quote, chapter.chapter_number)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            isQuoteSelected
                              ? 'border-pink-500 bg-pink-50 text-pink-900'
                              : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-gray-400 font-serif text-lg">"</span>
                            <p className="flex-1 text-sm leading-relaxed">
                              {quote}
                            </p>
                            {isQuoteSelected && (
                              <Check className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                    {quotes.length === 0 && (
                      <p className="text-sm text-gray-500 italic px-2">
                        No quotes found in this chapter.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-gray-50 shrink-0">
          <p className="text-xs text-gray-500 text-center">
            Select a quote to use it on your card
          </p>
        </div>
      </div>
    </div>
  );
}
