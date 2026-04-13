import { useEffect, useRef } from 'react';
import { createApp } from 'vue';
import { VueComposableApp } from '../vue/VueComposableApp';

export function VueComposableDemo() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const app = createApp(VueComposableApp);
    app.mount(mountRef.current);
    return () => app.unmount();
  }, []);

  return <div ref={mountRef} />;
}
