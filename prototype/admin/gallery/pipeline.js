// Admin gallery: the file pipeline shared by "Add" (add.js) and "Replace file"
// (drawer.js). One file in, the URLs the item needs out:
//   image: prepareImage -> upload                       -> {id, src, ratio, date}
//   video: preparePoster -> upload film -> upload poster
//          (posterFor = that film's key, never an older one) -> {id, src: film, poster, ratio, date}
// onStage(text) names the step, onProgress(pct 0..100) covers the whole file.
import { prepareImage, preparePoster, upload } from "/admin/shared/media.js";

const monthOf = (t) => {
  const d = new Date(t || Date.now());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export async function prepareAndUpload(file, kind, { onStage = () => {}, onProgress = () => {} } = {}) {
  const part = (lo, hi) => ({ loaded, total }) => onProgress(Math.round(lo + (hi - lo) * (total ? loaded / total : 0)));
  onStage("Preparing…");
  if (kind === "image") {
    const p = await prepareImage(file);
    onStage("Uploading…");
    const name = file.name.replace(/.[^.]+$/, "") + (p.type === "image/webp" ? ".webp" : ".jpg");
    const up = await upload(p.blob, name, { onProgress: part(0, 95) });
    return { id: up.id, src: up.url, ratio: p.ratio, date: p.date };
  }
  const p = await preparePoster(file);
  onStage("Uploading film…");
  const film = await upload(file, file.name, { onProgress: part(0, 90) });
  onStage("Uploading poster…");
  const pst = await upload(p.blob, "poster", { posterFor: film.key, onProgress: part(90, 97) });
  return { id: film.id, src: film.url, poster: pst.url, ratio: p.ratio, date: monthOf(file.lastModified) };
}
