"use client"
/**
 * @fileOverview Studio Preview - DECOMMISSIONED.
 * Protocol: Immediate redirect to Dashboard.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DecommissionedPreview() {
  const router = useRouter();
  useEffect(() => {
    router.push('/dashboard');
  }, [router]);
  return null;
}
