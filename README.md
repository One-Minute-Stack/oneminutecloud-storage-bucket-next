# @oneminutecloud/storage-bucket-next

> File uploads made **100x easier** for Next.js applications. No configuration hell, no S3 complexity, just upload.

[![npm version](https://badge.fury.io/js/@oneminutecloud%2Fstorage-bucket-next.svg)](https://www.npmjs.com/package/@oneminutecloud/storage-bucket-next)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🚀 **Simple API** - Just `await storage.upload(file, bucketId)`
- 🔒 **Secure by default** - API keys never exposed to the client
- 📦 **Multipart uploads** - Handle files of any size efficiently
- 🎯 **TypeScript support** - Full type safety out of the box
- ⚡ **Progress tracking** - Real-time upload progress callbacks
- 🌐 **Edge compatible** - Works with Next.js Edge Runtime
- 🪶 **Lightweight** - Only ~8KB gzipped

## 📦 Installation

```bash
npm install @oneminutecloud/storage-bucket-next
```

## 🚀 Quick Start

### 1. Get Your API Key

1. Sign up at [oneminutecloud.com](https://oneminutecloud.com)
2. Create a storage bucket
3. Copy your API key

### 2. Add API Key to Environment Variables

Create `.env.local` in your project root:

```env
ONEMINUTECLOUD_API_KEY=your_api_key_here
```

### 3. Create the API Route

Create `app/api/oneminutecloud/[provider]/route.ts`:

```typescript
import { handleStorageRequest } from "@oneminutecloud/storage-bucket-next";

export async function POST(
  request: Request,
  props: { params: Promise<{ provider: string }> }
) {
  return handleStorageRequest({
    request,
    props,
    apiKey: process.env.ONEMINUTECLOUD_API_KEY!,
  });
}
```

**That's it for setup!** 🎉

### 4. Upload Files in Your Components

```typescript
"use client";

import { storage } from "@oneminutecloud/storage-bucket-next";
import { useState } from "react";

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { key } = await storage.upload(file, "your-bucket-id");
      
      // Save the key to your database
      await fetch("/api/files", {
        method: "POST",
        body: JSON.stringify({ fileKey: key }),
      });

      alert("Upload successful!");
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleUpload} disabled={uploading} />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
```

## 📚 API Reference

### `storage.upload(file, bucketId, options?)`

Upload a file to your storage bucket.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | `File` | ✅ Yes | The file to upload |
| `bucketId` | `string` | ✅ Yes | Your bucket ID (UUID format) |
| `options` | `UploadOptions` | ❌ No | Upload options |

#### Options

```typescript
interface UploadOptions {
  onProgress?: (progress: {
    loaded: number;    // Bytes uploaded
    total: number;     // Total file size
    percent: number;   // Progress percentage (0-100)
  }) => void;
}
```

#### Returns

```typescript
Promise<{
  key: string;  // Unique key to retrieve the file later
}>
```

#### Example with Progress Tracking

```typescript
const { key } = await storage.upload(file, bucketId, {
  onProgress: (progress) => {
    console.log(`Upload progress: ${progress.percent}%`);
    setProgress(progress.percent);
  },
});
```

### `handleStorageRequest({ request, props, apiKey })`

API route handler for secure uploads.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `request` | `Request` | ✅ Yes | Next.js request object |
| `props` | `{ params: Promise<{ provider: string }> }` | ✅ Yes | Route params |
| `apiKey` | `string` | ✅ Yes | Your OneMinute Cloud API key |

#### Returns

```typescript
Promise<Response>
```

## 🎯 Complete Example

Here's a full example with progress tracking and error handling:

```typescript
"use client";

import { storage } from "@oneminutecloud/storage-bucket-next";
import { useState } from "react";

export default function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [fileKey, setFileKey] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setProgress(0);
      setFileKey(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const { key } = await storage.upload(file, "your-bucket-id", {
        onProgress: (p) => setProgress(p.percent),
      });

      // Save to your database
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileKey: key,
          fileSize: file.size,
          fileType: file.type,
        }),
      });

      setFileKey(key);
      alert("Upload successful!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
        className="block"
      />

      {file && (
        <div>
          <p>Selected: {file.name}</p>
          <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {uploading ? `Uploading... ${progress}%` : "Upload"}
      </button>

      {uploading && (
        <div className="w-full bg-gray-200 rounded">
          <div
            className="bg-blue-500 h-2 rounded transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {fileKey && (
        <div className="p-4 bg-green-50 rounded">
          <p>File uploaded successfully!</p>
          <p className="text-sm text-gray-600">Key: {fileKey}</p>
        </div>
      )}
    </div>
  );
}
```

## 🔒 Security

### API Key Protection

Your API key is **never exposed** to the client. It stays securely on your server:

```
Client → /api/oneminutecloud/[provider] (your Next.js API route)
         ↓ (API key added server-side)
         → OneMinute Cloud Backend
         ← Presigned URLs
Client → S3 directly (using presigned URLs)
```

### Best Practices

- ✅ **Always** store API keys in `.env.local`
- ✅ **Never** commit `.env.local` to Git
- ✅ Add `.env.local` to your `.gitignore`
- ✅ Use different API keys for development and production

## 📝 TypeScript Support

Full TypeScript support with type definitions included:

```typescript
import { storage, UploadOptions, UploadProgress } from "@oneminutecloud/storage-bucket-next";

const options: UploadOptions = {
  onProgress: (progress: UploadProgress) => {
    console.log(progress.percent);
  },
};

const { key } = await storage.upload(file, bucketId, options);
```

## 🤔 FAQ

### How do I get my bucket ID?

1. Go to your [OneMinute Cloud dashboard](https://oneminutecloud.com/dashboard)
2. Select your storage bucket
3. Copy the bucket ID from the settings

### What file types are supported?

Currently supported:
- ✅ Text files (`.txt`, `.md`, etc.)
- ✅ Images (`.jpg`, `.png`, `.gif`, `.webp`)
- ✅ Videos (`.mp4`, `.mov`, `.avi`, etc.)

### What's the maximum file size?

The SDK supports multipart uploads, so there's no practical limit. Files are automatically chunked for efficient upload.

### Can I use this with the Pages Router?

Yes! The API route works the same way:

```typescript
// pages/api/oneminutecloud/[provider].ts
import { handleStorageRequest } from "@oneminutecloud/storage-bucket-next";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Convert to Web API Request format
  const request = new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body: JSON.stringify(req.body),
  });

  const response = await handleStorageRequest({
    request,
    props: { params: Promise.resolve({ provider: req.query.provider as string }) },
    apiKey: process.env.ONEMINUTECLOUD_API_KEY!,
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}
```

### How do I retrieve uploaded files?

Use the returned `key` to construct the file URL:

```typescript
const fileUrl = `https://cdn.oneminutecloud.com/${bucketId}/${key}`;
```

Or retrieve through your API with proper access control.

## 🐛 Troubleshooting

### "Missing API route" error

Make sure you've created the API route at:
```
app/api/oneminutecloud/[provider]/route.ts
```

### "Invalid API key" error

1. Check that `ONEMINUTECLOUD_API_KEY` is set in `.env.local`
2. Verify the API key is correct in your dashboard
3. Restart your Next.js dev server after adding the env variable

### TypeScript errors

Make sure you have `next` installed as a peer dependency:

```bash
npm install next@latest
```

## 📄 License

MIT © [OneMinute Cloud](https://oneminutecloud.com)

## 🔗 Links

- [Documentation](https://docs.oneminutecloud.com)
- [Dashboard](https://oneminutecloud.com/dashboard)
- [Support](https://oneminutecloud.com/support)
- [GitHub](https://github.com/oneminutecloud/storage-bucket-next)

## 💬 Support

Need help? Reach out:

- 📧 Email: support@oneminutecloud.com
- 💬 Discord: [Join our community](https://discord.gg/oneminutecloud)
- 🐦 Twitter: [@oneminutecloud](https://twitter.com/oneminutecloud)

---

Made with ❤️ by the OneMinute Cloud team