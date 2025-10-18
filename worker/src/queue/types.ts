export type ImageJob = {
  id?: string;
  source: { type: 's3' | 'url'; bucket?: string; key?: string; url?: string };
  target?: { bucket?: string; key: string; format?: 'jpeg' | 'png' | 'webp' | 'avif' | 'heif'; contentType?: string };
  operations?: {
    resize?: { width?: number; height?: number; fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside' };
    quality?: number;
  };
  metadata?: Record<string, unknown>;
};

export type QueueHandler = (job: ImageJob) => Promise<void>;
