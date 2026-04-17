'use client';

import dynamic from 'next/dynamic';

const ChatWidget = dynamic(() => import('./ChatWidget'), {
  ssr: false,
  loading: () => null, // No loading UI — invisible until ready
});

export default function ChatWidgetLazy() {
  return <ChatWidget />;
}
