# Build Pagination / Infinite Scroll System

## Requirements

- Option A: Page-based pagination with prev/next buttons
- Option B: Infinite scroll (load more on scroll to bottom)
- Loading states, error handling
- Deduplication of results

## Pagination Implementation

```javascript
function PaginatedList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        setItems(data.items);
        setTotalPages(data.totalPages);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError('Could not load this page.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [page]);

  return (
    <div>
      {error && <p role="alert">{error}</p>}
      {loading ? <Spinner /> : items.map(item => <ItemCard key={item.id} item={item} />)}
      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const loadingRef = useRef(false);
  const observerRef = useRef();

  // Intersection Observer for detecting scroll to bottom
  const lastItemRef = useCallback(node => {
    if (observerRef.current) observerRef.current.disconnect();
    if (loading || error) return;

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
        loadingRef.current = true;
        setPage(p => p + 1);
      }
    });

    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, error]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      setError('');
      loadingRef.current = true;
      try {
        const res = await fetch(`/api/items?page=${page}&limit=20`, {
          signal: controller.signal
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        setItems(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          return [...prev, ...data.items.filter(item => !existingIds.has(item.id))];
        });
        setHasMore(data.items.length === 20);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError('Could not load more results.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          loadingRef.current = false;
        }
      }
    };
    fetchData();
    return () => controller.abort();
  }, [page, retry]);

  return (
    <div>
      {error && <p role="alert">{error}</p>}
      {items.map((item, i) => (
        <div key={item.id} ref={i === items.length - 1 ? lastItemRef : null}>
          <ItemCard item={item} />
        </div>
      ))}
      {loading && <Spinner />}
      {error && <button onClick={() => setRetry(count => count + 1)}>Retry</button>}
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
- Provide an explicit retry action and announce loading/results for keyboard and screen-reader users.

## Interview Tips

- Infinite scroll: mention Intersection Observer API
- Discuss trade-offs: pagination (SEO-friendly) vs infinite scroll (UX)
- Handle loading, error, and empty states
- Mention virtualization for performance with 10K+ items
