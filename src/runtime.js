// React is intentionally supplied by the existing CDN script at runtime.
// Keeping this adapter local lets source modules use normal imports while
// preserving the current GitHub Pages deployment contract.
const React = globalThis.React;

export default React;
export const { useState, useEffect, useRef, useCallback } = React;
