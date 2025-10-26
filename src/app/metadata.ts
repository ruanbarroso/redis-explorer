import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redis Explorer',
  description: 'Modern Redis GUI Explorer - Alternative to RedisInsight',
};

// This is a workaround to export metadata from a separate file
// since we can't export metadata from a client component.
