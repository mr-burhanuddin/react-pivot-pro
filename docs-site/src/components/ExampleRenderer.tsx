import type { ComponentType, LazyExoticComponent } from 'react';
import { Suspense } from 'react';

interface ExampleRendererProps {
  component: LazyExoticComponent<ComponentType>;
}

export function ExampleRenderer({ component: Component }: ExampleRendererProps) {
  return (
    <Suspense fallback={<div className="example-fallback">Loading example...</div>}>
      <Component />
    </Suspense>
  );
}
