export const MUTE_KEY = 'bannerline.mute';
export const COACH_KEY = 'bannerline.coach';

export function coachSeenValue(stored) {
  return stored === '1';
}

export function isMutedValue(stored) {
  return stored === '1';
}

export function muteStoreValue(muted) {
  return muted ? '1' : '0';
}
