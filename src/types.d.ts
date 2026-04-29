declare module 'react';
declare module 'react-dom/client';
declare module 'lucide-react';

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

interface Array<T> {
  at(index: number): T | undefined;
}
