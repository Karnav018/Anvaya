import { useEffect, useState } from 'react';
import { useUIStore } from '../../store/uiStore';

export function TopLoadingBar() {
  const activeRequests = useUIStore((state) => state.activeRequests);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;
    
    if (activeRequests > 0) {
      setVisible(true);
      setProgress(30);
      
      // Simulate progress moving along
      interval = setInterval(() => {
        setProgress((old) => {
          if (old > 85) return old;
          return old + Math.random() * 10;
        });
      }, 300);
    } else {
      setProgress(100);
      timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setProgress(0), 200);
      }, 400);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [activeRequests]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[9999] bg-transparent overflow-hidden">
      <div 
        className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_10px_#6366f1]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
