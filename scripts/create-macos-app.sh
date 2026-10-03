#!/usr/bin/env bash
set -e

# Detect macOS environment
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: create-macos-app.sh can only be executed on macOS."
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_TARGET="$PROJECT_DIR/GoMaster.app"
TMP_APPLESCRIPT="$PROJECT_DIR/.launcher_temp.applescript"

echo "Creating macOS App Launcher for GoMaster..."
echo "Project Directory: $PROJECT_DIR"
echo "Target App Bundle: $APP_TARGET"

# Generate AppleScript source
cat <<APPLESCRIPT > "$TMP_APPLESCRIPT"
set projectPath to "$PROJECT_DIR"
set isRunning to false

try
    set checkStatus to do shell script "curl -s -o /dev/null -w '%{http_code}' --connect-timeout 1 http://localhost:3001 || true"
    if checkStatus is not "" and checkStatus is not "000" then
        set isRunning to true
    end if
end try

if isRunning is false then
    tell application "Terminal"
        activate
        do script "export PATH=\"/opt/homebrew/bin:/usr/local/bin:\$PATH\"; cd " & quoted form of projectPath & " && npm run dev"
    end tell
    delay 3
end if

open location "http://localhost:3001"
APPLESCRIPT

# Remove previous bundle if exists
if [[ -d "$APP_TARGET" ]]; then
  rm -rf "$APP_TARGET"
fi

# Compile AppleScript into .app bundle
/usr/bin/osacompile -o "$APP_TARGET" "$TMP_APPLESCRIPT"
rm -f "$TMP_APPLESCRIPT"

# Apply custom GoMaster icon if available
ICNS_SOURCE="$PROJECT_DIR/assets/GoMaster.icns"
if [[ ! -f "$ICNS_SOURCE" ]]; then
  echo "Generating app icon first..."
  bash "$PROJECT_DIR/scripts/generate-icon.sh"
fi

if [[ -f "$ICNS_SOURCE" ]]; then
  echo "🎨 Applying custom GoMaster icon..."
  cp "$ICNS_SOURCE" "$APP_TARGET/Contents/Resources/applet.icns"

  # Remove macOS default Assets.car (prevents AppleScript scroll icon override)
  rm -f "$APP_TARGET/Contents/Resources/Assets.car"

  # Strip CFBundleIconName to force macOS to use CFBundleIconFile (applet.icns)
  if /usr/bin/plutil -p "$APP_TARGET/Contents/Info.plist" | grep -q 'CFBundleIconName'; then
    /usr/bin/plutil -remove CFBundleIconName "$APP_TARGET/Contents/Info.plist" || true
  fi

  touch "$APP_TARGET"
  touch "$APP_TARGET/Contents/Info.plist"
fi

echo "✅ Successfully created GoMaster.app bundle at: $APP_TARGET"
