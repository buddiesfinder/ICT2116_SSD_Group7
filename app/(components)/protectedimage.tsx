'use client';

import { useEffect, useState } from 'react';

export default function ProtectedImage({ src, alt = '', className = '' }: { src: string; alt?: string; className?: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      const cleanSrc  = src.replace(/^\+/, '');
      const url = `/api/image/${cleanSrc}`;
      console.log('[Protected Image] Requesting image: ', url);
      
      try {
        const res = await fetch(url, {
          headers: {
            'x-internal-request': 'true',
          },
        });

        if (!res.ok) throw new Error('Failed to load protected image');

        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch (err) {
        console.error('[ProtectedImage] Error loading image:', err);
      }
    };

    loadImage();

    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [src]);

  if (!imageUrl) return <div className="bg-gray-100 animate-pulse h-40" />;

  return <img src={imageUrl} alt={alt} className={className} />;
}
