# Build a Comment System (Nested/Threaded)

## Requirements
- Post comments, reply to comments (nested threads)
- Like/upvote comments, delete own comments
- Collapse/expand threads
- Sort by newest/oldest/most liked

## Data Model
```javascript
const comment = {
  id: 'c1', author: 'Alice', text: 'Great post!', timestamp: Date.now(),
  likes: 5, parentId: null, // null = top-level, 'c1' = reply to c1
};
```

## Core: Recursive Comment Tree
```javascript
function CommentThread({
  comments,
  parentId = null,
  depth = 0,
  collapsedIds = new Set(),
  onLike,
  onReply
}) {
  const replies = comments.filter(c => c.parentId === parentId);
  if (!replies.length) return null;

  return (
    <div style={{ marginLeft: depth * 24 }}>
      {replies.map(comment => (
        <div key={comment.id} className="comment">
          <div className="header">
            <strong>{comment.author}</strong>
            <span>{new Date(comment.timestamp).toLocaleString()}</span>
          </div>
          <p>{comment.text}</p>
          <div className="actions">
            <button onClick={() => onLike(comment.id)}>Like ({comment.likes})</button>
            <button onClick={() => onReply(comment.id)}>Reply</button>
          </div>
          {!collapsedIds.has(comment.id) && (
            <CommentThread
              comments={comments}
              parentId={comment.id}
              depth={depth + 1}
              collapsedIds={collapsedIds}
              onLike={onLike}
              onReply={onReply}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

## Key Patterns
- **Flat array + parentId** is simpler than nested objects for updates
- **Recursive component** to render nested threads
- **Max depth limit** (e.g., 5 levels) then "Continue this thread →"
- **Optimistic updates** for likes (increment immediately, revert on error)
- **Collapsible threads**: toggle visibility of child comments
- Pass actions explicitly instead of relying on undeclared outer-scope handlers.
- Build a `parentId -> children[]` index once for large threads; filtering the whole list at every recursive level is costly.
- Enforce ownership, rate limits, and text validation on the server; escape/render comment text as text, not HTML.
