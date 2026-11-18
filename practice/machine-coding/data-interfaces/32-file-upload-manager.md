# Build a File Upload Manager

## Interview Prompt
Build an upload queue that validates selected files, shows per-file status and progress, supports retry and cancel, and limits simultaneous uploads.

## Clarify First
- Which file types and size limits apply?
- Is progress required, and does the server support resumable/multipart upload?
- What should happen if one file fails while others are uploading?

## Data Model
```javascript
{
  id: 'upload-1',
  file: selectedFile,
  status: 'queued', // queued | uploading | complete | error | canceled
  progress: 0,
  error: null
}
```

## Bounded-Concurrency Worker
The transport is injected so the queue can use `XMLHttpRequest` for upload progress or a resumable-upload client.

```javascript
async function runQueue(files, uploadOne, concurrency = 3, onUpdate = () => {}) {
  const results = new Array(files.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < files.length) {
      const index = nextIndex++;
      const file = files[index];
      onUpdate(file.id, { status: 'uploading', progress: 0 });

      try {
        results[index] = await uploadOne(file, progress => {
          onUpdate(file.id, { status: 'uploading', progress });
        });
        onUpdate(file.id, { status: 'complete', progress: 100 });
      } catch (error) {
        results[index] = { error };
        onUpdate(file.id, { status: 'error', error: error.message });
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, files.length) }, () => worker())
  );
  return results;
}
```

## Interview Answer
- Validate size and MIME type on both client and server; the browser's `accept` attribute is only a chooser hint.
- Store upload state per file and derive aggregate progress from known file sizes when available.
- Give each request an `AbortController` or transport-specific cancel handle.
- Retry only failed uploads, with a bounded retry count and backoff; do not silently restart completed files.
- Use idempotency keys and server-side ownership checks for production uploads.
