import React, { useEffect } from '../runtime.js';

export default function FontLoader() {
  useEffect(() => {
    if (document.getElementById('ironlog-fonts')) return;
    const link = document.createElement('link');
    link.id = 'ironlog-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap';
    document.head.appendChild(link);
  }, []);
  return null;
}
