import { Suspense } from 'react';
import WeeklyPageClient from './WeeklyPageClient';
import { prisma } from '@/lib/prisma';

interface WeeklyPost {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  excerpt: string;
  cover?: string | null;
  views?: number;
  readingTime?: number;
}

async function getWeeklyPosts(): Promise<WeeklyPost[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/weekly/posts`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      console.error('Failed to fetch weekly posts');
      return [];
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching weekly posts:', error);
    return [];
  }
}

async function getAllViews(): Promise<Record<string, number>> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/weekly/views`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      return {};
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching views:', error);
    return {};
  }
}

export default async function WeeklyPage() {
  const [posts, viewsMap, panels] = await Promise.all([
    getWeeklyPosts(),
    getAllViews(),
    // 获取所有 panels 用于导航
    prisma.panel.findMany({
      orderBy: { sortOrder: 'asc' }
    })
  ]);

  return <WeeklyPageClient posts={posts} viewsMap={viewsMap} panels={panels} />;
}
