#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
RAW_DIR="${ROOT_DIR}/raw"

mkdir -p "${RAW_DIR}"

download_and_verify() {
  local url="$1"
  local dest="$2"
  local tmp_file="${dest}.tmp"

  echo "Downloading ${url} -> ${dest}..."
  rm -f "${tmp_file}"

  local max_attempts=4
  local attempt=1
  local delay=1
  local success=0

  while [ $attempt -le $max_attempts ]; do
    if curl -fsSL -A "Mozilla/5.0" "${url}" -o "${tmp_file}"; then
      # Check that file exists and is not empty
      if [ -s "${tmp_file}" ]; then
        # Verify file is CSV
        local first_line
        first_line=$(head -n 2 "${tmp_file}" | tr -d '\r')
        if [[ "${first_line}" == *","* ]] && ! [[ "${first_line}" =~ ^\<(!DOCTYPE|html|HTML) ]]; then
          success=1
          break
        else
          echo "Warning: Downloaded content is not valid CSV on attempt ${attempt}." >&2
        fi
      fi
    fi

    echo "Attempt ${attempt} failed for ${url}, retrying in ${delay}s..." >&2
    sleep "${delay}"
    delay=$((delay * 2))
    attempt=$((attempt + 1))
    rm -f "${tmp_file}"
  done

  if [ $success -ne 1 ]; then
    echo "ERROR: Failed to download and verify valid CSV from ${url} after ${max_attempts} attempts." >&2
    rm -f "${tmp_file}"
    return 1
  fi

  mv "${tmp_file}" "${dest}"
  echo "✓ Successfully saved ${dest} ($(wc -c < "${dest}") bytes)"
}

SEASONS=("2526" "2627")
LEAGUES=("E0" "SP1" "I1" "D1" "F1")

for season in "${SEASONS[@]}"; do
  for lg in "${LEAGUES[@]}"; do
    url="https://www.football-data.co.uk/mmz4281/${season}/${lg}.csv"
    dest="${RAW_DIR}/${lg}_${season}.csv"
    download_and_verify "${url}" "${dest}"
  done
done

# Download upcoming fixtures
url="https://www.football-data.co.uk/fixtures.csv"
dest="${RAW_DIR}/fixtures.csv"
download_and_verify "${url}" "${dest}"

echo "All data files successfully downloaded and verified in raw/."
