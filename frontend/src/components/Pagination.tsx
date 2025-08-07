import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const goToFirstPage = () => onPageChange(1);
  const goToLastPage = () => onPageChange(totalPages);
  const goToPreviousPage = () => onPageChange(Math.max(1, currentPage - 1));
  const goToNextPage = () => onPageChange(Math.min(totalPages, currentPage + 1));

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="pagination-wrapper">
      {/* Items per page selector */}
      <div className="items-per-page-container">
        <label className="items-per-page-label">Show:</label>
        <select
          className="form-control form-control-sm"
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="entries-text">entries</span>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            <span>
              Showing {startItem} to {endItem} of {totalItems} entries
            </span>
          </div>
          <div className="pagination-controls">
            <button
              className="btn btn-outline-secondary"
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              title="First page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              title="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="page-numbers">
              {getPageNumbers().map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="page-ellipsis">
                      ...
                    </span>
                  );
                }
                
                return (
                  <button
                    key={page}
                    className={`btn ${currentPage === page ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => onPageChange(page as number)}
                    title={`Go to page ${page}`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              className="btn btn-outline-secondary"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              title="Next page"
            >
              <ChevronRight size={16} />
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              title="Last page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagination; 