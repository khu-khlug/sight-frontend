import { useRef, useState } from "react";
import { scanImageData } from "@undecaf/zbar-wasm";

export type ScanResult = {
  type: string;
  data: string;
};

type Props = {
  onScan: (result: ScanResult) => void;
};

export default function BarcodeScanner({ onScan }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await new Promise((resolve) => (img.onload = resolve));

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    const symbols = await scanImageData(imageData);
    setProcessing(false);
    e.target.value = "";

    if (symbols.length > 0) {
      onScan({ type: symbols[0].typeName, data: symbols[0].decode() });
    } else {
      onScan({ type: "NONE", data: "" });
    }
  };

  return (
    <>
      <p
        style={{
          textAlign: "center",
          fontSize: "16px",
          color: "#333",
          margin: "0 0 12px",
          fontWeight: 500,
        }}
      >
        책의 바코드를 찍어주세요.
      </p>
      <div
        onClick={() => !processing && inputRef.current?.click()}
        style={{
          width: "100%",
          aspectRatio: "4/3",
          borderRadius: "12px",
          background: "#111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: processing ? "default" : "pointer",
        }}
      >
        <span style={{ color: "#fff", fontSize: "16px" }}>
          {processing ? "처리 중..." : "터치하여 스캔"}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleCapture}
      />
    </>
  );
}
