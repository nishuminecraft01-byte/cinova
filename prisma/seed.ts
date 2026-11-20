/**
 * Idempotent Prisma Seed Script for CINOVA Global Entertainment Platform
 *
 * Seeds:
 * 1. ISO 639-1 Languages (25+ languages)
 * 2. ISO 3166-1 alpha-2 Countries (26+ countries)
 * 3. Configurable Regional Defaults
 * 4. Canonical Genres & Genre Localizations
 *
 * Safe to run repeatedly — uses upsert on unique keys so duplicates are never created.
 * Usage: npx tsx prisma/seed.ts (after DATABASE_URL is configured and migrated)
 */

import { PrismaClient } from "@prisma/client";
import {
  REFERENCE_COUNTRIES,
  REFERENCE_GENRES,
  REFERENCE_LANGUAGES,
  REFERENCE_REGIONAL_DEFAULTS,
} from "../src/lib/i18n/reference-data";

const prisma = new PrismaClient();

export async function seedReferenceData(client: PrismaClient = prisma) {
  let languagesUpserted = 0;
  let countriesUpserted = 0;
  let defaultsUpserted = 0;
  let genresUpserted = 0;

  for (const lang of REFERENCE_LANGUAGES) {
    await client.language.upsert({
      where: { code: lang.code },
      update: {
        iso639_2: lang.iso639_2,
        englishName: lang.englishName,
        nativeName: lang.nativeName,
        isRtl: lang.isRtl,
        isUiSupported: lang.isUiSupported,
        isActive: lang.isActive,
      },
      create: lang,
    });
    languagesUpserted++;
  }

  for (const country of REFERENCE_COUNTRIES) {
    await client.country.upsert({
      where: { code: country.code },
      update: {
        englishName: country.englishName,
        nativeName: country.nativeName,
        regionGroup: country.regionGroup,
        isActive: country.isActive,
      },
      create: country,
    });
    countriesUpserted++;
  }

  for (const def of REFERENCE_REGIONAL_DEFAULTS) {
    await client.regionalDefault.upsert({
      where: { countryCode: def.countryCode },
      update: {
        defaultUiLanguageCode: def.defaultUiLanguageCode,
        fallbackUiLanguageCode: def.fallbackUiLanguageCode,
        defaultAudioLanguageCode: def.defaultAudioLanguageCode,
        secondaryAudioLanguageCode: def.secondaryAudioLanguageCode,
        defaultSubtitleLanguageCode: def.defaultSubtitleLanguageCode,
        featuredLanguageCodes: def.featuredLanguageCodes,
      },
      create: {
        countryCode: def.countryCode,
        defaultUiLanguageCode: def.defaultUiLanguageCode,
        fallbackUiLanguageCode: def.fallbackUiLanguageCode,
        defaultAudioLanguageCode: def.defaultAudioLanguageCode,
        secondaryAudioLanguageCode: def.secondaryAudioLanguageCode,
        defaultSubtitleLanguageCode: def.defaultSubtitleLanguageCode,
        featuredLanguageCodes: def.featuredLanguageCodes,
      },
    });
    defaultsUpserted++;
  }

  for (const genre of REFERENCE_GENRES) {
    const saved = await client.genre.upsert({
      where: { slug: genre.slug },
      update: {
        name: genre.name,
        tmdbGenreId: genre.tmdbGenreId ?? null,
      },
      create: {
        slug: genre.slug,
        name: genre.name,
        tmdbGenreId: genre.tmdbGenreId ?? null,
      },
    });
    genresUpserted++;

    if (genre.localizations) {
      for (const [langCode, localizedName] of Object.entries(genre.localizations)) {
        await client.genreLocalization.upsert({
          where: {
            genreId_languageCode: {
              genreId: saved.id,
              languageCode: langCode,
            },
          },
          update: { name: localizedName },
          create: {
            genreId: saved.id,
            languageCode: langCode,
            name: localizedName,
          },
        });
      }
    }
  }

  return {
    languagesUpserted,
    countriesUpserted,
    defaultsUpserted,
    genresUpserted,
  };
}

if (require.main === module) {
  seedReferenceData()
    .then((summary) => {
      console.log("CINOVA reference data seeded successfully:", summary);
    })
    .catch((err) => {
      console.error("CINOVA seed failed:", err instanceof Error ? err.message : err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
