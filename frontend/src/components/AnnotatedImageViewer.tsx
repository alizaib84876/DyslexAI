import { toAssetUrl } from "../lib/api";

type Props = {
  originalImagePath?: string | null;
  originalImageUrl?: string | null;
  annotatedImagePath?: string | null;
  preprocessedImagePath?: string | null;
};

export function AnnotatedImageViewer({
  originalImagePath,
  originalImageUrl,
  annotatedImagePath,
  preprocessedImagePath,
}: Props) {
  const originalUrl = toAssetUrl(originalImagePath, originalImageUrl);
  const annotatedUrl = toAssetUrl(annotatedImagePath);
  const preprocessedUrl = toAssetUrl(preprocessedImagePath);

  return (
    <section className="image-grid image-grid-full">
      <article className="card">
        <div className="card-header">
          <h3>Original Image</h3>
          <p>Your uploaded handwriting as it was received.</p>
        </div>
        {originalUrl ? (
          <div className="image-scroll-container">
            <img className="preview-image preview-image-full" src={originalUrl} alt="Original upload" />
          </div>
        ) : (
          <div className="image-placeholder">Original image will appear after processing.</div>
        )}
      </article>

      <article className="card">
        <div className="card-header">
          <h3>Preprocessed Preview</h3>
          <p>The structure-preserving page view used for paragraph ordering and OCR. Scroll to see the full image.</p>
        </div>
        {preprocessedUrl ? (
          <div className="image-scroll-container">
            <img className="preview-image preview-image-full" src={preprocessedUrl} alt="Preprocessed document" />
          </div>
        ) : (
          <div className="image-placeholder">Preprocessed preview will appear after processing.</div>
        )}
      </article>

      <article className="card">
        <div className="card-header">
          <h3>Annotated OCR View</h3>
          <p>Ordered line regions and suspicious areas are highlighted for review. Scroll to see the full image.</p>
        </div>
        {annotatedUrl ? (
          <div className="image-scroll-container">
            <img className="preview-image preview-image-full" src={annotatedUrl} alt="Annotated OCR result" />
          </div>
        ) : (
          <div className="image-placeholder">Annotated view will appear after processing.</div>
        )}
      </article>
    </section>
  );
}
