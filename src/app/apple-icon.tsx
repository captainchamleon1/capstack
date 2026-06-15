import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #131926 0%, #06080d 100%)",
          borderRadius: 36,
        }}
      >
        <svg width="100" height="100" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="18" width="18" height="10" rx="2" fill="#c9a962" fillOpacity="0.35" />
          <rect x="7" y="11" width="18" height="10" rx="2" fill="#c9a962" fillOpacity="0.65" />
          <rect x="10" y="4" width="18" height="10" rx="2" fill="#c9a962" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
