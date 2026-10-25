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

  if ! curl --retry 3 --retry-delay 2 -fsSL -A "Mozilla/5.0" "${url}" -o "${tmp_file}"; then
    echo "ERROR: Failed to download ${url}" >&2
    rm -f "${tmp_file}"
    return 1
  fi

  # Check that file exists and is not empty
  if [ ! -s "${tmp_file}" ]; then
    echo "ERROR: Downloaded file is empty: ${url}" >&2
    rm -f "${tmp_file}"
    return 1
  fi

  # Verify file is CSV (check header line for comma or known columns)
  local first_line
  first_line=$(head -n 2 "${tmp_file}" | tr -d '\r')
  if [[ "${first_line}" != *","* ]]; then
    echo "ERROR: Downloaded file does not appear to be CSV: ${url}" >&2
    echo "First line was: ${first_line}" >&2
    rm -f "${tmp_file}"
    return 1
  fi

  # Check if response was an HTML error page despite 200/302
  if [[ "${first_line}" =~ ^\<(!DOCTYPE|html|HTML) ]]; then
    echo "ERROR: Downloaded file is HTML, not CSV: ${url}" >&2
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
