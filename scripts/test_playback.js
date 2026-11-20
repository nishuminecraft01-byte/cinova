import { resolveStreamingServers, getStreamingServers } from "../src/lib/streaming-servers";
import { getSyncAvailability, resolveTmdbId, getAllVideoSources } from "../src/lib/video-sources";
import { SAMPLE_MOVIES } from "../src/data/movies";

async function run() {
  const testIds = [
    'oppenheimer',
    'dune',
    'inception',
    'avatar',
    'the-dark-knight',
    'john-wick-chapter-4',
    'breaking-bad',
    'stranger-things',
    'tmdb-1003596',
    'tmdb-movie-872585',
    'tmdb-872585',
    'sintel',
    'night-of-the-living-dead',
    'random-non-existent'
  ];

  console.log('Testing resolution:');
  for (const id of testIds) {
    const movie = SAMPLE_MOVIES.find(m => m.id === id || m.tmdbId === id.replace(/^tmdb-(?:movie-)?/, ''));
    const resolvedTmdb = resolveTmdbId(id, movie);
    const syncStatus = getSyncAvailability(id, movie);
    const syncStatusNoMovie = getSyncAvailability(id, null);
    const servers = await resolveStreamingServers(id, movie);
    console.log(`[${id}] -> tmdbId: ${resolvedTmdb} | syncWithMovie: ${syncStatus} | syncNoMovie: ${syncStatusNoMovie} | servers: ${servers.length}`);
  }
}

run().catch(console.error);
