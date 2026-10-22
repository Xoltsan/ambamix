import React, { useState } from 'react';

export default function ImageWithProxy({
  src,
  alt = '',
  className = '',
  style = {},
  loading = 'lazy'
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasTriedProxy, setHasTriedProxy] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Update src when prop changes
  React.useEffect(() => {
    setCurrentSrc(src);
    setHasTriedProxy(false);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasTriedProxy && src) {
      setHasTriedProxy(true);
      setCurrentSrc(`/api/proxy-image?url=${encodeURIComponent(src)}`);
    } else {
      setHasError(true);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        ...style
      }}
      className={className}
    >
      {!isLoaded && !hasError && (
        <div
          className="skeleton"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%'
          }}
        />
      )}

      {hasError ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-surface)',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            textAlign: 'center',
            padding: '1rem'
          }}
        >
          Gambar Gagal Dimuat
        </div>
      ) : (
        <img
          src={currentSrc}
          alt={alt}
          loading={loading}
          referrerPolicy="no-referrer"
          onError={handleError}
          onLoad={() => setIsLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.25s ease'
          }}
        />
      )}
    </div>
  );
}
