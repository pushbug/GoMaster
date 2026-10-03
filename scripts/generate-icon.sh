#!/usr/bin/env bash
set -e

# Detect macOS environment
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: generate-icon.sh can only be executed on macOS."
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSETS_DIR="$PROJECT_DIR/assets"
ICONSET_DIR="$ASSETS_DIR/GoMaster.iconset"
MASTER_PNG="$ASSETS_DIR/icon_1024.png"
TARGET_ICNS="$ASSETS_DIR/GoMaster.icns"
SWIFT_RENDERER="$PROJECT_DIR/.icon_render.swift"

mkdir -p "$ASSETS_DIR"
rm -rf "$ICONSET_DIR"
mkdir -p "$ICONSET_DIR"

echo "🎨 Generating 1024x1024 macOS Squircle Icon (White 'Go' on Black Background)..."

# Swift script using AppKit CoreGraphics for native anti-aliased font rendering
cat << 'SWIFT' > "$SWIFT_RENDERER"
import AppKit

let size = NSSize(width: 1024, height: 1024)
let image = NSImage(size: size)
image.lockFocus()

guard let ctx = NSGraphicsContext.current?.cgContext else {
    exit(1)
}

// Enable highest quality smoothing
ctx.setAllowsAntialiasing(true)
ctx.setShouldAntialias(true)
ctx.interpolationQuality = .high

// 1. Draw macOS App Icon Squircle Shape (insetting 60px for Apple standard corner margins)
let squircleRect = NSRect(x: 60, y: 60, width: 904, height: 904)
let cornerRadius: CGFloat = 205.0
let squirclePath = NSBezierPath(roundedRect: squircleRect, xRadius: cornerRadius, yRadius: cornerRadius)

// Subtle gradient fill for rich deep-black surface
let gradient = NSGradient(
    starting: NSColor(calibratedRed: 0.11, green: 0.12, blue: 0.14, alpha: 1.0),
    ending: NSColor(calibratedRed: 0.04, green: 0.05, blue: 0.06, alpha: 1.0)
)
gradient?.draw(in: squirclePath, angle: -45.0)

// Subtle border highlight (inner stroke)
NSColor(calibratedWhite: 1.0, alpha: 0.12).setStroke()
squirclePath.lineWidth = 6.0
squirclePath.stroke()

// 2. Draw Clean White "Go" Typography
let text = "Go" as NSString
let font = NSFont.systemFont(ofSize: 450, weight: .heavy)

// Drop shadow for subtle depth
let shadow = NSShadow()
shadow.shadowOffset = NSSize(width: 0, height: -12)
shadow.shadowBlurRadius = 24
shadow.shadowColor = NSColor(calibratedWhite: 0.0, alpha: 0.6)

let textAttributes: [NSAttributedString.Key: Any] = [
    .font: font,
    .foregroundColor: NSColor(calibratedWhite: 0.98, alpha: 1.0),
    .shadow: shadow
]

let textSize = text.size(withAttributes: textAttributes)
let textRect = NSRect(
    x: (size.width - textSize.width) / 2.0,
    y: (size.height - textSize.height) / 2.0 - 28.0,
    width: textSize.width,
    height: textSize.height
)

text.draw(in: textRect, withAttributes: textAttributes)

image.unlockFocus()

// Export to 1024x1024 PNG
if let tiff = image.tiffRepresentation,
   let bitmap = NSBitmapImageRep(data: tiff),
   let pngData = bitmap.representation(using: .png, properties: [:]) {
    let outPath = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "icon_1024.png"
    try? pngData.write(to: URL(fileURLWithPath: outPath))
}
SWIFT

mkdir -p "$PROJECT_DIR/.module-cache"
swift -module-cache-path "$PROJECT_DIR/.module-cache" "$SWIFT_RENDERER" "$MASTER_PNG"
rm -rf "$SWIFT_RENDERER" "$PROJECT_DIR/.module-cache"

echo "📐 Generating multi-resolution iconset..."
# Generate standard Apple iconset resolutions
sips -z 16 16     "$MASTER_PNG" --out "$ICONSET_DIR/icon_16x16.png" > /dev/null
sips -z 32 32     "$MASTER_PNG" --out "$ICONSET_DIR/icon_16x16@2x.png" > /dev/null
sips -z 32 32     "$MASTER_PNG" --out "$ICONSET_DIR/icon_32x32.png" > /dev/null
sips -z 64 64     "$MASTER_PNG" --out "$ICONSET_DIR/icon_32x32@2x.png" > /dev/null
sips -z 128 128   "$MASTER_PNG" --out "$ICONSET_DIR/icon_128x128.png" > /dev/null
sips -z 256 256   "$MASTER_PNG" --out "$ICONSET_DIR/icon_128x128@2x.png" > /dev/null
sips -z 256 256   "$MASTER_PNG" --out "$ICONSET_DIR/icon_256x256.png" > /dev/null
sips -z 512 512   "$MASTER_PNG" --out "$ICONSET_DIR/icon_256x256@2x.png" > /dev/null
sips -z 512 512   "$MASTER_PNG" --out "$ICONSET_DIR/icon_512x512.png" > /dev/null
cp "$MASTER_PNG" "$ICONSET_DIR/icon_512x512@2x.png"

echo "📦 Compiling GoMaster.icns via iconutil..."
iconutil -c icns "$ICONSET_DIR" -o "$TARGET_ICNS"
rm -rf "$ICONSET_DIR"

echo "✅ Created $TARGET_ICNS successfully!"
