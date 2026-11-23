// Verification script for CINOVA Watch History and Performance Optimizations
import { getUserWatchHistory, recordWatchProgress, removeWatchHistoryItem, clearUserWatchHistory } from '../src/lib/watch-history.js';

const BASE_URL = 'http://127.0.0.1:3000';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 CINOVA WATCH HISTORY & SPEED VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // --- TEST GROUP 1: WATCH HISTORY PERSISTENCE & AUTO-TRACKING ---
  console.log('--- TEST GROUP 1: Watch History Persistence ---');
  const testUserId = 'test_user_bench_' + Date.now();

  // Test 1: Record Movie Watch Progress
  const movieRec = await recordWatchProgress(testUserId, {
    contentId: 'tmdb-101',
    contentType: 'movie',
    title: 'Interstellar',
    posterUrl: 'https://image.tmdb.org/t/p/w500/interstellar.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/interstellar-bg.jpg',
    progressSeconds: 1200,
    durationSeconds: 9600,
  });
  assert('Movie progress recorded with valid ID', Boolean(movieRec && movieRec.id));
  assert('Progress percentage correctly computed (13%)', movieRec?.progressPercentage === 13);
  assert('Completion flag is false at 13%', movieRec?.completed === false);

  // Test 2: Update existing movie progress (deduplication check)
  const updatedMovieRec = await recordWatchProgress(testUserId, {
    contentId: 'tmdb-101',
    contentType: 'movie',
    title: 'Interstellar',
    progressSeconds: 8850,
    durationSeconds: 9600,
  });
  assert('Update updates same record key without duplicating', updatedMovieRec?.id === movieRec?.id);
  assert('Progress percentage updated to 92%', updatedMovieRec?.progressPercentage === 92);
  assert('Completed marked true (>= 92% threshold)', updatedMovieRec?.completed === true);

  // Test 3: Record TV Series Episode Watch Progress
  const tvRec1 = await recordWatchProgress(testUserId, {
    contentId: 'tmdb-series-77',
    contentType: 'series',
    title: 'Breaking Bad',
    seasonNumber: 1,
    episodeNumber: 1,
    episodeTitle: 'Pilot',
    progressSeconds: 900,
    durationSeconds: 3400,
  });
  assert('Series S1 E1 progress recorded', tvRec1 && tvRec1.seasonNumber === 1 && tvRec1.episodeNumber === 1);

  // Test 4: Record TV Series Next Episode (distinct composite key)
  const tvRec2 = await recordWatchProgress(testUserId, {
    contentId: 'tmdb-series-77',
    contentType: 'series',
    title: 'Breaking Bad',
    seasonNumber: 1,
    episodeNumber: 2,
    episodeTitle: 'Cat\'s in the Bag...',
    progressSeconds: 1500,
    durationSeconds: 3200,
  });
  assert('Distinct episode has distinct history entry ID', tvRec2 && tvRec2.id !== tvRec1?.id);

  // Test 5: Query user history categories
  const historyData = await getUserWatchHistory(testUserId);
  const allWatched = [...historyData.movies, ...historyData.series];
  assert('Query returns all 3 distinct user history records', allWatched.length === 3);
  assert('Movies section contains Interstellar', historyData.movies.some(m => m.contentId === 'tmdb-101'));
  assert('Series section contains both Breaking Bad episodes', historyData.series.length === 2);
  assert('Continue watching includes in-progress series episodes', historyData.continueWatching.length > 0);

  // Test 6: Single Item Removal
  const removed = await removeWatchHistoryItem(testUserId, 'tmdb-101');
  assert('Single item removal succeeded', removed === true);
  const afterRemoveData = await getUserWatchHistory(testUserId);
  const afterRemoveAll = [...afterRemoveData.movies, ...afterRemoveData.series];
  assert('History count reduced to 2 after single removal', afterRemoveAll.length === 2);
  assert('Removed movie is no longer in user history', !afterRemoveAll.some(h => h.contentId === 'tmdb-101'));

  // Test 7: Clear All History
  const cleared = await clearUserWatchHistory(testUserId);
  assert('Clear all history succeeded', cleared === true);
  const afterClearData = await getUserWatchHistory(testUserId);
  const afterClearAll = [...afterClearData.movies, ...afterClearData.series];
  assert('History is completely empty after clear all', afterClearAll.length === 0);

  // Test 8: Security & Unauthorized API Access Check
  console.log('\n--- TEST GROUP 2: Security & Server Auth Enforcement ---');
  try {
    const unauthPost = await fetch(`${BASE_URL}/api/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId: 'tmdb-fake' }),
    });
    assert('POST /api/history without session is rejected with 401 Unauthorized', unauthPost.status === 401);

    const unauthDelete = await fetch(`${BASE_URL}/api/history?contentId=tmdb-fake`, {
      method: 'DELETE',
    });
    assert('DELETE /api/history without session is rejected with 401 Unauthorized', unauthDelete.status === 401);
  } catch (err) {
    console.error('API test error:', err.message);
  }

  // --- TEST GROUP 3: PERFORMANCE BENCHMARKS ---
  console.log('\n--- TEST GROUP 3: Latency & Performance Benchmarks ---');

  async function measureLatency(name, url) {
    const start = performance.now();
    const res = await fetch(url);
    const end = performance.now();
    const duration = Math.round(end - start);
    const cacheHeader = res.headers.get('x-cache') || res.headers.get('cache-control') || 'none';
    console.log(`  ⏱️  [${name}] ${duration}ms (status: ${res.status}, cache: ${cacheHeader.slice(0, 35)})`);
    return { duration, status: res.status };
  }

  // Measure Independent Music API (previously 8,300ms bottleneck)
  const indep1 = await measureLatency('Independent Music (First)', `${BASE_URL}/api/music/independent?limit=16`);
  const indep2 = await measureLatency('Independent Music (Cached)', `${BASE_URL}/api/music/independent?limit=16`);
  assert('Warm Independent Music response is fast (< 500ms in dev)', indep2.duration < 500);

  // Measure Trending Music
  const trend1 = await measureLatency('Trending Music (First)', `${BASE_URL}/api/music/trending?country=IN&limit=20`);
  const trend2 = await measureLatency('Trending Music (Cached)', `${BASE_URL}/api/music/trending?country=IN&limit=20`);
  assert('Cached Trending Music response is fast (< 500ms in dev)', trend2.duration < 500);

  // Measure Search
  const search1 = await measureLatency('Search "Arijit Singh" (Initial)', `${BASE_URL}/api/music/search?q=Arijit+Singh&limit=10`);
  const search2 = await measureLatency('Search "Arijit Singh" (Cached)', `${BASE_URL}/api/music/search?q=Arijit+Singh&limit=10`);
  assert('Cached Search query response is near-instant (< 500ms in dev)', search2.duration < 500);

  // Measure Albums & Artists
  const albums = await measureLatency('Albums API', `${BASE_URL}/api/music/albums?limit=8`);
  const artists = await measureLatency('Artists API', `${BASE_URL}/api/music/artists?limit=8`);
  assert('Albums API returns 200 OK', albums.status === 200);
  assert('Artists API returns 200 OK', artists.status === 200);

  // Measure Homepage
  const home = await measureLatency('Homepage (/)', `${BASE_URL}/`);
  assert('Homepage returns 200 OK', home.status === 200);

  // Measure History Page
  const hist = await measureLatency('History Page (/history)', `${BASE_URL}/history`);
  assert('History Page returns 200 OK', hist.status === 200);

  console.log('\n====================================================');
  console.log(`🎯 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
