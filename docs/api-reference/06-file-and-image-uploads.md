# 06 - File and Image Uploads

CSCRS relies on binary media uploads for reporting civic complaints, proving work completion, and attaching logs for debugging system issues.

## 1. Central Upload Validator (`validate_uploaded_file`)
To ensure safety and compatibility, all file uploads are intercepted by a central validation function (`utils/file_utils.py`) that enforces the following checks:
1. **Filename Presence:** Rejects files with empty or missing filename metadata with a `400 Bad Request` (`"Filename is missing."`).
2. **Extension Allowlist:** The file extension (case-insensitive) must exist in the endpoint's configured allowlist (e.g. `.jpg`, `.mp4`). Failure raises a `400 Bad Request` (`"Unsupported file extension."`).
3. **MIME-Type (Content-Type) Allowlist:** The request payload header `Content-Type` must match allowed MIME profiles (e.g. `image/jpeg`). Failure raises a `400 Bad Request` (`"Unsupported file type."`).
4. **Empty File Check:** Rejects 0-byte uploads with a `400 Bad Request` (`"Uploaded file is empty."`).
5. **Size Validation:** Enforces strict maximum size boundaries. Exceeding the maximum allowed size raises an HTTP **`413 Payload Too Large`** (`"File size exceeds allowed limit."`).
6. **Binary Magic-Byte (Signature) Verification:** Checks the first 16 bytes of the file to verify that the format signature matches the extension. Modifying extensions (e.g., renaming a `.txt` to `.png`) will fail.
   * **Images:**
     * `.jpg` / `.jpeg` — Must start with `\xff\xd8\xff`
     * `.png` — Must start with `\x89PNG\r\n\x1a\n`
     * `.webp` — Must start with `RIFF` and have `WEBP` at bytes 8-12.
   * **Videos:**
     * `.mp4` — Byte header at offset 4-8 must match `ftyp` (minimum 12 bytes length).
     * `.mov` — Byte header at offset 4-8 must match `ftyp` (minimum 12 bytes length).
     * `.avi` — Must start with `RIFF` and have `AVI ` at bytes 8-12.
     * `.mkv` — Must start with `\x1A\x45\xDF\xA3`.

Failure to pass any of these steps results in immediate execution cancellation and cleanup (unlinking temporary files).

---

## 2. Storage & Randomization
* **UUID Rename:** To prevent filename collisions and directory traversal security holes, all files are renamed using a random hex string format:
  ```
  [UUID_v4_Hex_String].[extension]
  ```
  *(e.g., `5a3b2c1d9e8f7a6b5c4d3e2f1a0b9c8d.webp`)*
* **Storage Folders:** Validated files are saved to subdirectories within the `uploads/` folder:
  * `uploads/` — Original citizen report images.
  * `uploads/resolution/` — Worker post-repair proof images.
  * `uploads/profile/` — User profile avatar photos.
  * `uploads/system_issues/` — Attachments explaining system bug tickets.

---

## 3. Upload Specifications Matrix

Use the reference table below for constructing client-side multipart form requests:

| Use Case | Form Field | Allowed File Extensions | Allowed MIME Types | Maximum Size | Important Validation Rules |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Citizen Report** | `file` | `.jpg`, `.jpeg`, `.png`, `.webp` | `image/jpeg`, `image/png`, `image/webp` | **10 MB** | Image validation only. Analyzed by the AI YOLO computer vision engine. |
| **Worker Resolution** | `image` | `.jpg`, `.jpeg`, `.png`, `.webp` | `image/jpeg`, `image/png`, `image/webp` | **10 MB** | Image validation only. Checked by OpenCLIP against original report for scene similarity. |
| **Profile Avatar** | `photo` | `.jpg`, `.jpeg`, `.png`, `.webp` | `image/jpeg`, `image/png`, `image/webp` | **5 MB** | Image validation only. Overwrites existing photo and deletes old media from disk. |
| **System Issue** | `attachments` | `.jpg`, `.jpeg`, `.png`, `.webp`, `.mp4`, `.mov`, `.avi`, `.mkv` | `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/quicktime`, `video/x-msvideo`, `video/x-matroska` | **10 MB** each | Supports up to **5 attachments** per ticket. Allows both image and video uploads. |
