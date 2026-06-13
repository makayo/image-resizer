import { useState, useRef, useCallback } from "react";

export default function ImageResizer() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [outputSize, setOutputSize] = useState(0);
  const [quality, setQuality] = useState(0.8);
  const [maxDim, setMaxDim] = useState(500);
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const canvasRef = useRef(null);

  const handleFile = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setOriginalSize(file.size);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target.result);
      setDownloadUrl(null);
      setOutputSize(0);
    };
    reader.readAsDataURL(file);
  }, []);

  const processImage = useCallback(() => {
    if (!image) return;
    setProcessing(true);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            setOutputSize(blob.size);
            const url = URL.createObjectURL(blob);
            setPreview(url);
            setDownloadUrl(url);
          }
          setProcessing(false);
        },
        "image/jpeg",
        quality,
      );
    };
    img.src = image;
  }, [image, quality, maxDim]);

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(2) + " MB";
  };

  const underLimit = outputSize > 0 && outputSize < 1048576;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem 1rem",
      }}
    >
      <h1
        style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}
      >
        Image Resizer
      </h1>
      <p
        style={{ color: "#94a3b8", fontSize: "0.875rem", marginBottom: "2rem" }}
      >
        Resize images under 1 MB
      </p>

      <div
        onDrop={handleFile}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById("file-input").click()}
        style={{
          border: "2px dashed #334155",
          borderRadius: "12px",
          padding: "3rem 2rem",
          textAlign: "center",
          cursor: "pointer",
          width: "100%",
          maxWidth: "420px",
          marginBottom: "1.5rem",
        }}
      >
        <p style={{ color: "#94a3b8" }}>Drop image here or click to select</p>
        <input
          id="file-input"
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: "none" }}
        />
      </div>

      {image && (
        <div style={{ width: "100%", maxWidth: "420px" }}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                fontSize: "0.875rem",
                color: "#94a3b8",
                display: "block",
                marginBottom: "0.25rem",
              }}
            >
              Max dimension: {maxDim}px
            </label>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={maxDim}
              onChange={(e) => setMaxDim(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#3b82f6" }}
            />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                fontSize: "0.875rem",
                color: "#94a3b8",
                display: "block",
                marginBottom: "0.25rem",
              }}
            >
              Quality: {Math.round(quality * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#3b82f6" }}
            />
          </div>

          <button
            onClick={processImage}
            disabled={processing}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: processing ? "#1e3a5f" : "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: processing ? "wait" : "pointer",
              marginBottom: "1.5rem",
            }}
          >
            {processing ? "Resizing..." : "Resize"}
          </button>

          {outputSize > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                background: "#1e293b",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                marginBottom: "1rem",
                fontSize: "0.875rem",
              }}
            >
              <span>Original: {formatSize(originalSize)}</span>
              <span
                style={{
                  color: underLimit ? "#4ade80" : "#f87171",
                  fontWeight: 600,
                }}
              >
                Output: {formatSize(outputSize)}{" "}
                {underLimit ? "\u2713" : "\u2717 over 1 MB"}
              </span>
            </div>
          )}

          {preview && (
            <div style={{ textAlign: "center" }}>
              <img
                src={preview}
                alt="Resized preview"
                style={{
                  maxWidth: "100%",
                  borderRadius: "50%",
                  border: "3px solid #334155",
                  marginBottom: "1rem",
                }}
              />
              <br />
              <a
                href={downloadUrl}
                download="resized-image.jpg"
                style={{
                  display: "inline-block",
                  padding: "0.625rem 1.5rem",
                  background: "#22c55e",
                  color: "#fff",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Download
              </a>
            </div>
          )}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
