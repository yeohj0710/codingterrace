interface PaginationProps {
  currentPage: number;
  totalPages: number;
  paginate: (pageNumber: number) => void;
}

export default function PostPagination({
  currentPage,
  totalPages,
  paginate,
}: PaginationProps) {
  return (
    <div className="flex justify-center mt-4">
      {currentPage > 2 && (
        <button
          onClick={() => paginate(1)}
          className={`px-3 py-1 mx-1 rounded ${
            currentPage === 1
              ? "bg-green-400 text-white"
              : "bg-gray-300 text-gray-700"
          }`}
        >
          1
        </button>
      )}
      {currentPage > 3 && <span className="px-3 py-1 mx-1">...</span>}
      {Array.from({ length: totalPages }, (_, index) => index + 1)
        .filter(
          (page) =>
            page === currentPage ||
            (page >= currentPage - 1 && page <= currentPage + 1)
        )
        .map((page) => (
          <button
            key={page}
            onClick={() => paginate(page)}
            className={`px-3 py-1 mx-1 rounded ${
              currentPage === page
                ? "bg-green-400 text-white"
                : "bg-gray-300 text-gray-700"
            }`}
          >
            {page}
          </button>
        ))}
      {currentPage < totalPages - 2 && (
        <span className="px-3 py-1 mx-1">...</span>
      )}
      {currentPage < totalPages - 1 && (
        <button
          onClick={() => paginate(totalPages)}
          className={`px-3 py-1 mx-1 rounded ${
            currentPage === totalPages
              ? "bg-green-400 text-white"
              : "bg-gray-300 text-gray-700"
          }`}
        >
          {totalPages}
        </button>
      )}
    </div>
  );
}
