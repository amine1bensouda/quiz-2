'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

const AnimatedShapes = dynamic(() => import('./AnimatedShapes'), {
  ssr: false,
  loading: () => null,
});

export default function AnimatedShapesClient(
  props: ComponentProps<typeof AnimatedShapes>
) {
  return <AnimatedShapes {...props} />;
}
