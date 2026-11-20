"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { capturePhoto } from "@/modules/documents/capture";

interface PhotoCaptureFormProps {
  category: string;
  livestockIdentifierId?: string | null;
}

export default function PhotoCaptureForm({
  category,
  livestockIdentifierId = null,
}: PhotoCaptureFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [message, setMessage] = useState("");
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("Capturing...");
    let lat = latitude;
    let lng = longitude;
    if (hasConsent) {
      const position = await new Promise<GeolocationPosition | null>((resolve) => {
        if (typeof navigator.geolocation?.getCurrentPosition === "function") {
          navigator.geolocation.getCurrentPosition(resolve, () => resolve(null));
        } else {
          resolve(null);
        }
      });
      if (position?.coords) {
        lat = String(position.coords.latitude);
        lng = String(position.coords.longitude);
      }
    }
    const formData = new FormData();
    formData.append("category", category);
    formData.append("hasGeoConsent", String(hasConsent));
    formData.append("deviceInfo", deviceInfo || userAgent);
    formData.append("latitude", lat);
    formData.append("longitude", lng);
    formData.append("idempotencyKey", crypto.randomUUID());
    if (livestockIdentifierId) {
      formData.append("livestockIdentifierId", livestockIdentifierId);
    }
    if (file) {
      formData.append("file", file);
    }
    const result = await capturePhoto(formData);
    setMessage(
      result.ok
        ? `Captured — photo ${result.photoId ?? ""} will be reviewed by validation.`
        : `Capture failed — ${result.error ?? "try again"}`,
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="text-sm text-zinc-600 dark:text-zinc-400"
        />
      </div>
      <div>
        <input
          type="text"
          value={deviceInfo}
          placeholder="Device (optional, e.g. camera model)"
          onChange={(event) => setDeviceInfo(event.target.value)}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-zinc-600 dark:text-zinc-400">
          Latitude
          <input
            type="number"
            step="0.00001"
            value={latitude}
            placeholder="auto"
            onChange={(event) => setLatitude(event.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:bg-zinc-950"
          />
        </label>
        <label className="text-sm text-zinc-600 dark:text-zinc-400">
          Longitude
          <input
            type="number"
            step="0.00001"
            value={longitude}
            placeholder="auto"
            onChange={(event) => setLongitude(event.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:bg-zinc-950"
          />
        </label>
      </div>
      <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={hasConsent}
          onChange={(event) => setHasConsent(event.target.checked)}
          className="mt-1"
        />
        I allow using the photo with GPS location, where legal.
      </label>
      <button
        type="submit"
        disabled={!file}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        Capture photo
      </button>
      {message && <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>}
    </form>
  );
}
