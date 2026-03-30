import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "64px",
          height: "64px",
          background: "#000000",
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <div
          style={{
            width: "46px",
            height: "46px",
            border: "2px solid rgba(197,179,88,0.85)",
            borderRadius: "12px",
            position: "relative",
            display: "flex",
            boxShadow: "0 0 18px rgba(197,179,88,0.12)"
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "9px",
              right: "9px",
              top: "12px",
              height: "2px",
              background: "rgba(197,179,88,0.75)"
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "9px",
              right: "16px",
              top: "21px",
              height: "2px",
              background: "rgba(197,179,88,0.55)"
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "9px",
              right: "12px",
              top: "30px",
              height: "2px",
              background: "rgba(197,179,88,0.45)"
            }}
          />
          <div
            style={{
              position: "absolute",
              right: "9px",
              top: "10px",
              width: "8px",
              height: "8px",
              borderRadius: "99px",
              background: "rgba(197,179,88,0.55)"
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}

