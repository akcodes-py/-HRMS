import { useState } from 'react'

export const usePagination = (initialPage = 1, initialPageSize = 10) => {
  const [page, setPage] = useState(initialPage)
  const [pageSize] = useState(initialPageSize)
  const [totalCount, setTotalCount] = useState(0)

  const totalPages = Math.ceil(totalCount / pageSize)

  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setPage(p)
  }

  const nextPage = () => goToPage(page + 1)
  const prevPage = () => goToPage(page - 1)
  const reset = () => setPage(1)

  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    setTotalCount,
    goToPage,
    nextPage,
    prevPage,
    reset,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  }
}
