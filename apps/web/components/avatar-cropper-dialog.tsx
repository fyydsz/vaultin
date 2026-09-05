"use client";

import React, { useState, useRef, SyntheticEvent } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2Icon, CropIcon, RotateCcwIcon } from "lucide-react";

interface AvatarCropperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  onCropSave: (croppedFile: File) => Promise<void>;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 80,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop
): Promise<File> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const targetSize = Math.max(256, Math.min(crop.width * scaleX, 1024));
  canvas.width = targetSize;
  canvas.height = targetSize;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create canvas 2d context");
  }

  // Smooth image rendering
  ctx.imageSmoothingQuality = "high";
  ctx.imageSmoothingEnabled = true;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    targetSize,
    targetSize
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to generate cropped image blob"));
          return;
        }
        const file = new File([blob], `avatar-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        resolve(file);
      },
      "image/jpeg",
      0.92
    );
  });
}

export function AvatarCropperDialog({
  open,
  onOpenChange,
  imageSrc,
  onCropSave,
}: AvatarCropperDialogProps) {
  const aspect = 1; // 1:1 square / circle crop for avatars
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);

  const onImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerAspectCrop(width, height, aspect);
    setCrop(initialCrop);
  };

  const handleResetCrop = () => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  };

  const handleSave = async () => {
    if (!imgRef.current || !completedCrop || completedCrop.width === 0) {
      return;
    }

    setCropError(null);
    setIsSaving(true);

    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop);
      await onCropSave(croppedFile);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to crop image";
      setCropError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 sm:p-6 overflow-hidden">
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <CropIcon className="size-4 text-primary" />
            Crop Profile Picture
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Drag to adjust your photo or resize the circular crop area.
          </DialogDescription>
        </DialogHeader>

        {cropError && (
          <div className="rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive border border-destructive/20">
            {cropError}
          </div>
        )}

        {/* Cropper Workspace */}
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/40 border border-border/60 min-h-[260px] max-h-[360px] overflow-hidden">
          {imageSrc ? (
            <div className="relative flex items-center justify-center max-h-[320px] max-w-full overflow-hidden">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                circularCrop
                className="max-h-[300px] max-w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imageSrc}
                  onLoad={onImageLoad}
                  className="max-h-[300px] max-w-full object-contain select-none"
                  crossOrigin="anonymous"
                />
              </ReactCrop>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground py-10">
              No image loaded
            </div>
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetCrop}
            disabled={isSaving}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 cursor-pointer"
          >
            <RotateCcwIcon className="size-3.5" />
            Reset
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !completedCrop}
              className="gap-1.5 text-xs font-semibold h-8 cursor-pointer"
            >
              {isSaving && <Loader2Icon className="size-3.5 animate-spin" />}
              Apply & Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
