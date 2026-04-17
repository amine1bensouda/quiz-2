'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

const BackgroundPattern = dynamic(() => import('./BackgroundPattern'), {
  ssr: false,
  loading: () => null,
});

export default function BackgroundPatternClient(
  props: ComponentProps<typeof BackgroundPattern>
) {
  return <BackgroundPattern {...props} />;
}
