import { useCallback, useEffect, useRef, useState } from "react";

import type { Page } from "../types";
import { getErrorMessage } from "../utils/errors";

interface Options {
  /** Reload from page 1 whenever these change (e.g. a search query). */
  deps?: readonly unknown[];
  /** When false nothing is fetched and the list is empty (e.g. empty search box). */
  enabled?: boolean;
}

export function usePaginated<T extends { id: number }>(
  fetchPage: (page: number) => Promise<Page<T>>,
  { deps = [], enabled = true }: Options = {},
) {
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  const [items, setItems] = useState<T[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0); // discards responses from superseded requests
  const pageRef = useRef(1);
  const hasNextRef = useRef(false);
  const firstLoadBusy = useRef(false);
  const moreBusy = useRef(false);

  const loadFirstPage = useCallback(async (mode: "initial" | "refresh") => {
    const id = ++requestId.current;
    firstLoadBusy.current = true;
    if (mode === "initial") {
      setItems([]);
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const result = await fetchRef.current(1);
      if (id !== requestId.current) return;
      pageRef.current = 1;
      hasNextRef.current = Boolean(result.next);
      setHasNext(hasNextRef.current);
      setItems(result.results);
      setError(null);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(getErrorMessage(e));
    } finally {
      if (id === requestId.current) {
        firstLoadBusy.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (moreBusy.current || firstLoadBusy.current || !hasNextRef.current) return;
    moreBusy.current = true;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const result = await fetchRef.current(nextPage);
      if (id !== requestId.current) return;
      pageRef.current = nextPage;
      hasNextRef.current = Boolean(result.next);
      setHasNext(hasNextRef.current);
      setItems((previous) => {
        const seen = new Set(previous.map((item) => item.id));
        return [...previous, ...result.results.filter((item) => !seen.has(item.id))];
      });
    } catch (e) {
      if (id === requestId.current) setError(getErrorMessage(e));
    } finally {
      moreBusy.current = false;
      setLoadingMore(false);
    }
  }, []);

  const refresh = useCallback(() => loadFirstPage("refresh"), [loadFirstPage]);
  const retry = useCallback(() => loadFirstPage("initial"), [loadFirstPage]);

  useEffect(() => {
    if (!enabled) {
      requestId.current++;
      firstLoadBusy.current = false;
      hasNextRef.current = false;
      setItems([]);
      setHasNext(false);
      setLoading(false);
      setRefreshing(false);
      setError(null);
      return;
    }
    loadFirstPage("initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, loadFirstPage, ...deps]);

  return { items, setItems, loading, refreshing, loadingMore, error, hasNext, refresh, retry, loadMore };
}
