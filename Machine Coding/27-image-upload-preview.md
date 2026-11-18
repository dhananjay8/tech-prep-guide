# Build an Image Upload with Preview

## Requirements
- Select one or more image files
- Validate file type and size
- Show local previews before upload
- Remove selected files and clean object URLs

## Implementation
```javascript
import { useEffect, useRef, useState } from 'react';

function ImageUploadPreview({ maxSizeMb = 5, multiple = true }) {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const previewUrls = useRef(new Set());

  const handleChange = (event) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    const validFiles = [];
    setError('');

    for (const file of selectedFiles) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        continue;
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        setError(`Each file must be smaller than ${maxSizeMb}MB`);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.add(previewUrl);
      validFiles.push({ id: crypto.randomUUID(), file, previewUrl });
    }

    if (multiple) {
      setFiles(prev => [...prev, ...validFiles]);
    } else {
      files.forEach(item => {
        URL.revokeObjectURL(item.previewUrl);
        previewUrls.current.delete(item.previewUrl);
      });
      setFiles(validFiles.slice(0, 1));
    }
    event.target.value = '';
  };

  const removeFile = (id) => {
    const fileToRemove = files.find(item => item.id === id);
    if (!fileToRemove) return;
    URL.revokeObjectURL(fileToRemove.previewUrl);
    previewUrls.current.delete(fileToRemove.previewUrl);
    setFiles(prev => prev.filter(item => item.id !== id));
  };

  useEffect(() => {
    return () => {
      previewUrls.current.forEach(url => URL.revokeObjectURL(url));
      previewUrls.current.clear();
    };
  }, []);

  return (
    <div>
      <input type="file" accept="image/*" multiple={multiple} onChange={handleChange} />
      {error && <p role="alert">{error}</p>}
      <ul>
        {files.map(item => (
          <li key={item.id}>
            <img src={item.previewUrl} alt={item.file.name} width={120} />
            <button onClick={() => removeFile(item.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Key Patterns
- **Object URLs**: preview local files without upload
- **Cleanup**: revoke removed/replaced URLs and all remaining URLs on unmount
- **Validation**: type and size before adding
- **Reset input**: allow reselecting the same file
- Do not revoke every URL whenever the files array changes; that breaks retained previews.

## Interview Tips
- Discuss drag-and-drop as an extension
- Mention server upload progress and retry
- Do not base validation only on filename extension
