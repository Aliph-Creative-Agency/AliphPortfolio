// The Worker in front of the static site. P-01: pass-through only — every
// request it receives goes straight to the assets binding, unchanged, so the
// site is byte-identical to the assets-only deployment. Later tasks add the
// published-content rewrite and the admin routes here.
//
// wrangler.toml `run_worker_first` decides which URLs reach this script at
// all (pages, /api/*, /admin*); css/js/img/fonts are served by the assets
// layer directly and never cost a Worker request.

export interface Env {
  ASSETS: Fetcher;
  /** The content store (migrations/). Local miniflare D1 in development. */
  DB: D1Database;
  /** aliph-media, for admin uploads. Local miniflare R2 in development. */
  MEDIA_BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
