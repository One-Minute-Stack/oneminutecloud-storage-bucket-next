# @oneminutecloud/storage-bucket-next

> File uploads and previews made **100x easier** for Next.js applications. No configuration hell, no S3 complexity, just upload and preview.

[![npm version](https://badge.fury.io/js/@oneminutecloud%2Fstorage-bucket-next.svg)](https://www.npmjs.com/package/@oneminutecloud/storage-bucket-next)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🚀 **Simple API** - Just `await storage.upload(file, bucketId)` and `await storage.get(key)`
- 🔒 **Secure by default** - API keys never exposed to the client
- 📦 **Multipart uploads** - Handle files of any size efficiently
- 🖼️ **Instant previews** - Get presigned URLs with one line of code
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

Create `.env` in your project root:

```env
ONEMINUTECLOUD_API_KEY=your_api_key_here
```

### 3. Create the API Route

Create `app/api/oneminutecloud/[provider]/route.ts`:

```typescript
import { handleStorageRequest } from "@oneminutecloud/storage-bucket-next";

export async function POST(
  request: Request,
  props: { params: Promise<{ provider: string }> },
) {
  return handleStorageRequest({
    request,
    props,
    apiKey: process.env.ONEMINUTECLOUD_API_KEY!,
  });
}
```

**That's it for setup!** 🎉

### 4. Upload Files

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
    } catch (error:any) {
      console.error("Upload failed:", error.message);
      alert(error.message);
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

### 5. Preview Files

```typescript
"use client";

import { storage } from "@oneminutecloud/storage-bucket-next";
import { useState } from "react";

export default function FilePreview({ fileKey }: { fileKey: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadPreview = async () => {
    try {
      const { url } = await storage.get(fileKey);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Failed to load preview:", error);
    }
  };

  return (
    <div>
      <button onClick={loadPreview}>Load Preview</button>
      {previewUrl && <img src={previewUrl} alt="Preview" />}
    </div>
  );
}
```

## 📚 API Reference

### `storage.upload(file, bucketId, options?)`

Upload a file to your storage bucket.

#### Parameters

| Parameter  | Type            | Required | Description                  |
| ---------- | --------------- | -------- | ---------------------------- |
| `file`     | `File`          | ✅ Yes   | The file to upload           |
| `bucketId` | `string`        | ✅ Yes   | Your bucket ID (UUID format) |
| `options`  | `UploadOptions` | ❌ No    | Upload options               |

#### Options

```typescript
interface UploadOptions {
  onProgress?: (progress: {
    loaded: number; // Bytes uploaded
    total: number; // Total file size
    percent: number; // Progress percentage (0-100)
  }) => void;
}
```

#### Returns

```typescript
Promise<{
  key: string; // Unique key to retrieve the file later
}>;
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

---

### `storage.get(key)`

Get a secure, temporary URL to preview or download a file.

#### Parameters

| Parameter | Type     | Required | Description                                   |
| --------- | -------- | -------- | --------------------------------------------- |
| `key`     | `string` | ✅ Yes   | The file key returned from `storage.upload()` |

#### Returns

```typescript
Promise<{
  url: string; // Presigned URL (valid for 5 minutes)
  expiresAt: number; // Unix timestamp when URL expires
}>;
```

#### Examples

**Image Preview:**

```typescript
const { url, expiresAt } = await storage.get(fileKey);

// Display image
<img src={url} alt="Preview" />

// Check expiration
console.log(`URL expires at: ${new Date(expiresAt * 1000).toLocaleString()}`);
```

**Video Player:**

```typescript
const { url } = await storage.get(videoKey);

<video src={url} controls />
```

**File Download:**

```typescript
const { url } = await storage.get(fileKey);

<a href={url} download>Download File</a>
```

**Server-Side Preview (App Router):**

```typescript
// app/files/[key]/page.tsx
import { storage } from "@oneminutecloud/storage-bucket-next";

export default async function FilePage({ params }: { params: { key: string } }) {
  const { url } = await storage.get(params.key);

  return <img src={url} alt="File" />;
}
```

---

### `handleStorageRequest({ request, props, apiKey })`

API route handler for secure uploads and previews.

#### Parameters

| Parameter | Type                                        | Required | Description                  |
| --------- | ------------------------------------------- | -------- | ---------------------------- |
| `request` | `Request`                                   | ✅ Yes   | Next.js request object       |
| `props`   | `{ params: Promise<{ provider: string }> }` | ✅ Yes   | Route params                 |
| `apiKey`  | `string`                                    | ✅ Yes   | Your OneMinute Cloud API key |

#### Returns

```typescript
Promise<Response>;
```

## 🎯 Complete Example: Upload & Preview

```typescript
"use client";

import { storage } from "@oneminutecloud/storage-bucket-next";
import { useState } from "react";

export default function FileManager() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [fileKey, setFileKey] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setProgress(0);
      setFileKey(null);
      setPreviewUrl(null);
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

      // Automatically load preview
      const { url } = await storage.get(key);
      setPreviewUrl(url);

      alert("Upload successful!");
    } catch (error:any) {
      console.error("Upload failed:", error?.message);
      alert(error?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* File Input */}
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
        accept="image/*,video/*"
        className="block"
      />

      {/* File Info */}
      {file && (
        <div>
          <p>Selected: {file.name}</p>
          <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
      >
        {uploading ? `Uploading... ${progress}%` : "Upload"}
      </button>

      {/* Progress Bar */}
      {uploading && (
        <div className="w-full bg-gray-200 rounded h-2">
          <div
            className="bg-blue-500 h-2 rounded transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Preview */}
      {previewUrl && (
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Preview:</h3>
          {file?.type.startsWith("image/") ? (
            <img src={previewUrl} alt="Preview" className="max-w-md rounded" />
          ) : file?.type.startsWith("video/") ? (
            <video src={previewUrl} controls className="max-w-md rounded" />
          ) : (
            <a href={previewUrl} download className="text-blue-500 underline">
              Download File
            </a>
          )}
          <p className="text-sm text-gray-500 mt-2">Key: {fileKey}</p>
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
         ← Presigned URLs (time-limited)
Client → S3/CDN directly (using presigned URLs)
```

### Presigned URL Security

- ⏱️ **Time-limited** - URLs expire after 5 minutes
- 🔐 **Access controlled** - Your backend validates ownership before generating URLs
- 🚫 **No direct access** - Files aren't publicly accessible without valid presigned URLs

### Best Practices

- ✅ **Always** store API keys in `.env`
- ✅ **Never** commit `.env` to Git
- ✅ Add `.env` to your `.gitignore`
- ✅ Use different API keys for development and production
- ✅ Validate file ownership on your backend before displaying previews

## 📝 TypeScript Support

Full TypeScript support with type definitions included:

```typescript
import {
  storage,
  UploadOptions,
  UploadProgress,
  PreviewResult,
} from "@oneminutecloud/storage-bucket-next";

const options: UploadOptions = {
  onProgress: (progress: UploadProgress) => {
    console.log(progress.percent);
  },
};

const { key } = await storage.upload(file, bucketId, options);
const preview: PreviewResult = await storage.get(key);
```

## 🤔 FAQ

### How do I get my bucket ID?

1. Go to your [OneMinute Cloud dashboard](https://dashboard.oneminutecloud.com/storage)
2. Select your storage bucket
3. Copy the bucket ID from the three dot on the right side

### What file types are supported?

Currently supported:

- ✅ Text files (`.txt`, `.md`, etc.)
- ✅ Images (`.jpg`, `.png`, `.gif`, `.webp`)
- ✅ Videos (`.mp4`, `.mov`, `.avi`, etc.)

### What's the maximum file size?

The SDK supports multipart uploads, so there's no practical limit. Files are automatically chunked for efficient upload.

### How long are preview URLs valid?

Preview URLs are valid for 5 minutes by default. After that, you need to call `storage.get()` again to generate a new URL.

### Can I use this with the Pages Router?

Yes! The API route works the same way:

```typescript
// pages/api/oneminutecloud/[provider].ts
import { handleStorageRequest } from "@oneminutecloud/storage-bucket-next";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const request = new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body: JSON.stringify(req.body),
  });

  const response = await handleStorageRequest({
    request,
    props: {
      params: Promise.resolve({ provider: req.query.provider as string }),
    },
    apiKey: process.env.ONEMINUTECLOUD_API_KEY!,
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}
```

### Can I control who can access files?

Yes! Implement access control in your own API:

```typescript
// app/api/files/[key]/route.ts
import { storage } from "@oneminutecloud/storage-bucket-next";
import { getServerSession } from "next-auth";

export async function GET(
  request: Request,
  { params }: { params: { key: string } },
) {
  const session = await getServerSession();

  // Check if user owns this file
  const file = await db.files.findOne({ key: params.key });
  if (file.userId !== session.user.id) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Generate preview URL
  const { url } = await storage.get(params.key);
  return Response.json({ url });
}
```

## 🐛 Troubleshooting

### "Missing API route" error

Make sure you've created the API route at:

```
app/api/oneminutecloud/[provider]/route.ts
```

### "Invalid API key" error

1. Check that `ONEMINUTECLOUD_API_KEY` is set in `.env`
2. Verify the API key is correct in your dashboard
3. Restart your Next.js dev server after adding the env variable

### "Failed to get file preview" error

1. Make sure the file key exists and was returned from `storage.upload()`
2. Verify you have access to the file
3. Check that the bucket still exists
4. Check your account data transfer limit

### TypeScript errors

Make sure you have `next` installed as a peer dependency:

```bash
npm install next@latest
```

## 📄 License

MIT © [OneMinute Cloud](https://oneminutecloud.com)

## 🔗 Links

- [Documentation](https://docs.oneminutecloud.com)
- [Dashboard](https://dashboard.oneminutecloud.com)
- [Support](mailto:contact@oneminutstack.com)
- [GitHub](https://github.com/One-Minute-Stack/oneminutecloud-storage-bucket-next)

## 💬 Support

Need help? Reach out:

- 📧 Email: contact@oneminutstack.com
- 💬 Discord: [Join our community](https://discord.gg/oneminutestack)
- 🐦 Twitter: [@oneminutecloud](https://twitter.com/oneminutestack)

---

Made with ❤️ by the OneMinute Stack team
