"use client"
/**
 * @fileOverview Studio Editor - DECOMMISSIONED.
 * Protocol: Immediate redirect to Dashboard.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DecommissionedEditor() {
  const router = useRouter();
  useEffect(() => {
    router.push('/dashboard');
  }, [router]);
  return null;
}
