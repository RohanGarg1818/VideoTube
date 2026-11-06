import { useCallback, useEffect, useRef, useState } from "react";
import { apiErrorMessage } from "../services/api";
import type { Page } from "../services/endpoints";

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const callId = useRef(0);

  const run = useCallback(async () => {
    const id = ++callId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fn();
      if (id === callId.current) setData(res); // ignore stale responses
    } catch (e) {
      if (id === callId.current) setError(e);
    } finally {
      if (id === callId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return {
    data,
    loading,
    error,
    errorMessage: error ? apiErrorMessage(error) : null,
    refetch: run,
    setData,
  };
}

/** Accumulates pages from a paginated endpoint ("load more" / infinite scroll). */
export function usePaginated<T>(
  fetchPage: (page: number) => Promise<Page<T>>,
  deps: unknown[] = [],
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const callId = useRef(0);

  const load = useCallback(
    async (p: number) => {
      const id = ++callId.current;
      if (p === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const res = await fetchPage(p);
        if (id !== callId.current) return;
        setItems((prev) => (p === 1 ? res.docs : [...prev, ...res.docs]));
        setPage(p);
        setTotal(res.totalDocs);
        setHasMore(res.hasNextPage);
      } catch (e) {
        if (id === callId.current) setError(e);
      } finally {
        if (id === callId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  useEffect(() => {
    load(1);
  }, [load]);

  return {
    items,
    setItems,
    total,
    setTotal,
    hasMore,
    loading,
    loadingMore,
    error,
    errorMessage: error ? apiErrorMessage(error) : null,
    loadMore: () => !loadingMore && hasMore && load(page + 1),
    reload: () => load(1),
  };
}

/** Calls `onVisible` when the returned ref's element scrolls into view. */
export function useInView(onVisible: () => void, enabled = true) {
  const ref = useRef<HTMLDivElement | null>(null);
  const cb = useRef(onVisible);
  cb.current = onVisible;
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const io = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && cb.current(),
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enabled]);
  return ref;
}
