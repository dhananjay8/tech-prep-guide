# Build Pagination / Infinite Scroll System

## Requirements

- Option A: Page-based pagination with prev/next buttons
- Option B: Infinite scroll (load more on scroll to bottom)
- Loading states, error handling
- Deduplication of results

The examples use React hooks and assume an API returns `{ items, totalPages }`
for page controls and `{ items, hasMore }` for infinite scroll. Item IDs must
be stable.

## Pagination Implementation

```javascript
function PaginatedList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/items?page=${page}&limit=20`, {
          signal: controller.signal
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        if (controller.signal.aborted) return;
        setItems(data.items);
        setTotalPages(data.totalPages);
      } catch (requestError) {
        if (!controller.signal.aborted && requestError.name !== 'AbortError') {
          setError('Could not load this page.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [page, retry]);

  const retryPage = () => {
    setError('');
    setLoading(true);
    setRetry(count => count + 1);
  };

  return (
    <div>
      {error && <p role="alert">{error} <button onClick={retryPage}>Retry</button></p>}
      {loading && <Spinner />}
      {!loading && !error && items.map(item => <ItemCard key={item.id} item={item} />)}
      <div className="pagination">
        <button disabled={loading || Boolean(error) || page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
        <span>{!loading && !error && totalPages === 0 ? 'No pages' : `Page ${page} of ${totalPages}`}</span>
        <button disabled={loading || Boolean(error) || page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
}
```

## Infinite Scroll Implementation

```javascript
function InfiniteScrollList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/items?page=${page}&limit=20`, {
          signal: controller.signal
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        if (controller.signal.aborted) return;
        setItems(prev => {
          const byId = new Map(prev.map(item => [item.id, item]));
          for (const item of data.items) byId.set(item.id, item);
          return [...byId.values()];
        });
        setHasMore(data.hasMore);
      } catch (requestError) {
        if (!controller.signal.aborted && requestError.name !== 'AbortError') {
          setError('Could not load more results.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [page, retry]);

  useEffect(() => {
    if (loading || error || !hasMore || !sentinelRef.current) return;
    let active = true;
    const observer = new IntersectionObserver(entries => {
      if (!active || !entries.some(entry => entry.isIntersecting)) return;
      active = false;
      observer.disconnect();
      setLoading(true);
      setPage(current => current + 1);
    });
    observer.observe(sentinelRef.current);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [loading, error, hasMore, page]);

  const retryPage = () => {
    setError('');
    setLoading(true);
    setRetry(count => count + 1);
  };

  return (
    <div>
      {error && <p role="alert">{error}</p>}
      {items.map(item => <ItemCard key={item.id} item={item} />)}
      {hasMore && <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />}
      {loading && <Spinner />}
      {error && <button onClick={retryPage}>Retry</button>}
    </div>
  );
}
```

## Key Concepts

- **Intersection Observer** is the modern, performant way vs scroll event listeners
- **Cursor-based pagination** (better for real-time data): `?cursor=abc&limit=20`
- **Virtualization**: Only render visible items (react-window/react-virtualized) for large lists
- For infinite scroll, abort on unmount/query change and prevent concurrent page requests.
- Reset the page or cursor when filters change; deduplicate appended records by stable ID.
- Use the server's `hasMore` flag so short pages do not incorrectly terminate the list. The API must eventually return `hasMore: false`; avoid returning empty pages with `hasMore: true` indefinitely.
- Provide an explicit retry action and announce loading/results for keyboard and screen-reader users.
- A visible **Load more** button is a useful alternative or fallback when automatic observation is not desirable.

## Interview Tips

- Infinite scroll: mention Intersection Observer API
- Discuss trade-offs: pagination (SEO-friendly) vs infinite scroll (UX)
- Handle loading, error, and empty states
- Mention virtualization for performance with 10K+ items
