import { useEffect, useState } from "react";
import { vauletService } from "../services/vauletService.js";
import { InlineMessage } from "./Feedback.jsx";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function MemoryUploadForm({ vauletId, onAdded }) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!file) { setPreview(""); return undefined; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function chooseFile(event) {
    const nextFile = event.target.files?.[0] || null;
    setError("");
    if (nextFile && !allowedTypes.includes(nextFile.type)) { setError("Choose a JPEG, PNG, WEBP, or GIF image."); setFile(null); return; }
    if (nextFile && nextFile.size > MAX_FILE_BYTES) { setError("The image is too large. Maximum size is 8 MB."); setFile(null); return; }
    setFile(nextFile);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!file) { setError("Choose a photo first."); return; }
    setSaving(true);
    try {
      await vauletService.addMemory(vauletId, { file, caption: caption.trim(), location: location.trim() });
      setFile(null);
      setCaption("");
      setLocation("");
      await onAdded?.();
    } catch (issue) {
      setError(issue.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel memory-form" onSubmit={submit}>
      <div><p className="eyebrow">Save the moment</p><h2>Add a memory</h2><p className="muted-copy">Photos are stored with Cloudinary, not on the API server.</p></div>
      {preview && <img className="memory-preview" src={preview} alt="Selected photo preview" />}
      <label className="upload-drop"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseFile} /><span className="upload-symbol">↑</span><strong>{file ? file.name : "Choose a photo"}</strong><small>JPEG, PNG, WEBP or GIF · Up to 8 MB</small></label>
      <label className="field"><span>Caption <small>Optional</small></span><input value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={500} placeholder="The first day, finally here" /></label>
      <label className="field"><span>Location <small>Optional</small></span><input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={200} placeholder="Palolem Beach" /></label>
      <InlineMessage message={error} />
      <button className="button button-primary button-full" disabled={saving}>{saving ? "Uploading…" : "Add to Memory Vault"}</button>
    </form>
  );
}
