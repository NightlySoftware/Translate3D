import {useEffect, useState} from 'react';

export function ClientOnly<T>({
  children,
  fallback = null,
}: {
  children: () => T;
  fallback?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return fallback;
  return children();
}

