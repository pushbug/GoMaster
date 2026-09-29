#!/usr/bin/env bash
# ==============================================================================
# GoMaster - Automated KataGo & Neural Network Setup for macOS
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENGINE_DIR="${PROJECT_ROOT}/engine"
MODELS_DIR="${ENGINE_DIR}/models"
CONFIG_DIR="${ENGINE_DIR}/config"
CONFIG_FILE="${CONFIG_DIR}/analysis.cfg"
ENV_LOCAL="${PROJECT_ROOT}/.env.local"

# KataGo Neural Network model:
# b18c384nbt-humanv0 is KataGo's official human-calibrated network (~60MB)
MODEL_FILENAME="kata1-b18c384nbt-humanv0.bin.gz"
MODEL_URL="https://github.com/lightvector/KataGo/releases/download/v1.15.0/b18c384nbt-humanv0.bin.gz"
FALLBACK_MODEL_URL="https://media.katagotraining.org/uploaded/networks/models/kata1/kata1-b15c192-s1672170752-d466197061.txt.gz"
MODEL_TARGET="${MODELS_DIR}/${MODEL_FILENAME}"

echo "=========================================================="
echo "🎯 GoMaster: Setting up KataGo Analysis Engine on macOS"
echo "=========================================================="

mkdir -p "${MODELS_DIR}" "${CONFIG_DIR}"

# 1. Verify or locate KataGo binary
KATAGO_BIN=""
if command -v katago &>/dev/null; then
  KATAGO_BIN="$(command -v katago)"
elif [[ -x "/opt/homebrew/bin/katago" ]]; then
  KATAGO_BIN="/opt/homebrew/bin/katago"
elif [[ -x "/usr/local/bin/katago" ]]; then
  KATAGO_BIN="/usr/local/bin/katago"
fi

if [[ -z "${KATAGO_BIN}" ]]; then
  echo "⚠️  KataGo binary was not found on your system."
  if command -v brew &>/dev/null; then
    echo "📦 Installing KataGo via Homebrew..."
    brew install katago
    KATAGO_BIN="$(command -v katago || echo '/opt/homebrew/bin/katago')"
  else
    echo "❌ Homebrew is not installed. Please install Homebrew or install katago manually."
    exit 1
  fi
fi

echo "✅ KataGo binary located at: ${KATAGO_BIN}"

# 2. Download KataGo Neural Network model if missing or corrupted (<1MB)
if [[ -f "${MODEL_TARGET}" ]]; then
  EXISTING_SIZE=$(wc -c < "${MODEL_TARGET}" | tr -d ' ')
  if [[ ${EXISTING_SIZE} -lt 1048576 ]]; then
    echo "⚠️  Existing model file is too small (${EXISTING_SIZE} bytes), likely corrupted. Removing..."
    rm -f "${MODEL_TARGET}"
  fi
fi

if [[ ! -f "${MODEL_TARGET}" ]]; then
  echo "📥 Downloading KataGo Neural Network model (~60MB)..."
  echo "   Source: ${MODEL_URL}"
  curl -L --retry 3 --progress-bar "${MODEL_URL}" -o "${MODEL_TARGET}" || {
    echo "⚠️  Primary download failed. Trying fallback mirror..."
    curl -L --retry 3 --progress-bar "${FALLBACK_MODEL_URL}" -o "${MODEL_TARGET}"
  }

  DOWNLOADED_SIZE=$(wc -c < "${MODEL_TARGET}" | tr -d ' ')
  if [[ ${DOWNLOADED_SIZE} -lt 1048576 ]]; then
    echo "❌ Downloaded model file is too small (${DOWNLOADED_SIZE} bytes). Download aborted."
    rm -f "${MODEL_TARGET}"
    exit 1
  fi
  echo "✅ Model validated and saved (${DOWNLOADED_SIZE} bytes): ${MODEL_TARGET}"
else
  echo "✅ Model already exists and valid: ${MODEL_TARGET}"
fi

# 3. Generate KataGo Analysis configuration tuned for Apple Silicon & Desktop
if [[ ! -f "${CONFIG_FILE}" ]]; then
  echo "⚙️ Generating KataGo analysis configuration: ${CONFIG_FILE}..."
  cat <<'EOF' > "${CONFIG_FILE}"
# ------------------------------------------------------------------------------
# GoMaster - KataGo Analysis Engine Configuration
# Optimized for macOS (Metal / OpenCL / CPU)
# ------------------------------------------------------------------------------

# Performance & Threading
# 2 analysis threads with 4 search threads are ideal for desktop responsiveness alongside Next.js
numAnalysisThreads = 2
numSearchThreadsPerAnalysisThread = 4
nnMaxBatchSize = 8
maxVisits = 1000

# Cache limits (MB)
nnCacheSizePowerOfTwo = 18
nnMutexPoolSizePowerOfTwo = 15
nnRandomize = true

# Analysis format & 1 Dan Calibration
reportAnalysisWinratesAs = SIDETOMOVE
humanSLProfile = preaz_1d

# Logging
logToStderr = false
EOF
  echo "✅ Configuration file created."
else
  echo "✅ Configuration file already exists: ${CONFIG_FILE}"
fi

# 4. Write/Update .env.local configuration
echo "📝 Updating ${ENV_LOCAL} with absolute engine paths..."

# Remove existing KataGo variables if present
if [[ -f "${ENV_LOCAL}" ]]; then
  grep -v "^KATAGO_" "${ENV_LOCAL}" > "${ENV_LOCAL}.tmp" || true
  mv "${ENV_LOCAL}.tmp" "${ENV_LOCAL}"
fi

cat <<EOF >> "${ENV_LOCAL}"
KATAGO_PATH=${KATAGO_BIN}
KATAGO_CONFIG=${CONFIG_FILE}
KATAGO_MODEL=${MODEL_TARGET}
EOF

echo "=========================================================="
echo "🎉 KataGo setup complete!"
echo "   Binary : ${KATAGO_BIN}"
echo "   Config : ${CONFIG_FILE}"
echo "   Model  : ${MODEL_TARGET}"
echo "   Env    : ${ENV_LOCAL}"
echo "Restart your Next.js server (npm run dev) to load KataGo!"
echo "=========================================================="
