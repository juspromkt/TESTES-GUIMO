import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

const Pagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
}: PaginationProps) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-300 sm:px-6">
      <div className="flex items-center">
        <label htmlFor="itemsPerPage" className="mr-2 text-sm text-gray-700">
          Mostrar
        </label>
        <select
          id="itemsPerPage"
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <span className="ml-2 text-sm text-gray-700">itens por página</span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <span className="text-sm text-gray-700">
          Página {currentPage} de {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;