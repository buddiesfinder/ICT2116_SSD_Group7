'use client';

import { useEffect, useState } from 'react';

type Props = {
  src: string; // relative to /uploads directory, e.g. "events/banner1.jpg"
  alt?: string;
  className?: string;
};

export default function ProtectedImage({ src, alt = '', className }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const res = await fetch(`/api/image/${src}`, {
          headers: { 'x-internal-request': 'true' },
        });

        if (!res.ok) throw new Error('Failed to load image');

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (err) {
        console.error('[ProtectedImage] Load error:', err);
      }
    };

    fetchImage();

    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [src]);

  if (!imageUrl) return <div className="bg-gray-200 animate-pulse w-full h-40" />;

  return <img src={imageUrl} alt={alt} className={className} />;
}
