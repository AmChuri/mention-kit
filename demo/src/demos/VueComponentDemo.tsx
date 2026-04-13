import { useEffect, useRef } from 'react';
import { createApp } from 'vue';
import { VueComponentApp } from '../vue/VueComponentApp';

export function VueComponentDemo() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const app = createApp(VueComponentApp);
    app.mount(mountRef.current);
    return () => app.unmount();
  }, []);

  return <div ref={mountRef} />;
}
