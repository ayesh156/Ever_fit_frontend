import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  dark?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, dark = false }) => {
  if (totalPages <= 1) return null;

  // Generate page numbers to display
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const textColor = dark ? 'text-blue-400/80' : 'text-blue-500';
  const btnInactive = `bg-transparent ${textColor} hover:text-white transition-colors`;
  const btnDisabled = `opacity-30 cursor-not-allowed bg-transparent ${dark ? 'text-blue-400/40' : 'text-blue-300'}`;

  return (
    <div className="flex justify-between items-center w-full py-4">
      {/* Left side: page info */}
      <span className={`text-sm ${textColor}`}>
        Page {currentPage} of {totalPages}
      </span>

      {/* Right side: controls */}
      <div className="flex items-center space-x-1">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-150 ${
            currentPage === 1 ? btnDisabled : btnInactive
          }`}
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-150 ${
            currentPage === 1 ? btnDisabled : btnInactive
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {pageNumbers.map((page, idx) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${idx}`}
              className={`w-8 h-8 flex items-center justify-center text-xs ${dark ? 'text-blue-400/50' : 'text-blue-300'}`}
            >
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-150 ${
                currentPage === page
                  ? 'bg-white text-black shadow-sm font-medium'
                  : btnInactive
              }`}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-150 ${
            currentPage === totalPages ? btnDisabled : btnInactive
          }`}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-150 ${
            currentPage === totalPages ? btnDisabled : btnInactive
          }`}
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};