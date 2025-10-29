import React, { useRef, useState, useEffect } from "react";

/**
 * OptimizedImage
 * - lazy loads via IntersectionObserver
 * - shows FA-image icon placeholder (weiß auf schwarz, blurred) until loaded
 * - accepts srcs array (prefer small first)
 */
export default function OptimizedImage({ srcs = [], alt = "", className = "", placeholder = "", style = {} }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            obs.disconnect();
          }
        });
      },
      { rootMargin: "200px" }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const candidate = (srcs || []).find(Boolean) || placeholder || "";
    setSrc(candidate);
  }, [inView, srcs, placeholder]);

  return (
    <div
      ref={ref}
      className={`opt-img-wrap ${className}`}
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#000",
        ...style,
      }}
      aria-hidden={false}
    >
      {!loaded && (
        <div className="opt-placeholder" aria-hidden="true">
          <i className="fa-solid fa-image" />
        </div>
      )}

      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`opt-img ${loaded ? "opt-img-loaded" : ""}`}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : null}
    </div>
  );
}