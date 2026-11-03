// Save and Progress Manager (localStorage)

const STORAGE_KEY = 'frostgate_wardens_save';

export class SaveManager {
    constructor() {
        this.data = {
            unlockedRegions: [1],
            stars: {},
            bestEndlessWave: 0,
            tutorialCompleted: false,
            tutorialStep: 0,
            speed: 1,
            muted: false
        };
        this.load();
    }

    load() {
        try {
            if (typeof localStorage !== 'undefined') {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    this.data = Object.assign(this.data, parsed);
                }
            }
        } catch (e) {
            console.warn('Failed to load save from localStorage', e);
        }
        return this.data;
    }

    save() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
            }
        } catch (e) {
            console.warn('Failed to save to localStorage', e);
        }
    }

    recordVictory(regionId, stars) {
        const curStars = this.data.stars[regionId] || 0;
        if (stars > curStars) {
            this.data.stars[regionId] = stars;
        }
        // Unlock next region
        const nextRegion = regionId + 1;
        if (nextRegion <= 5 && !this.data.unlockedRegions.includes(nextRegion)) {
            this.data.unlockedRegions.push(nextRegion);
        }
        this.save();
    }

    recordEndlessWave(wave) {
        if (wave > this.data.bestEndlessWave) {
            this.data.bestEndlessWave = wave;
            this.save();
        }
    }

    setTutorialCompleted() {
        this.data.tutorialCompleted = true;
        this.save();
    }

    setTutorialStep(step) {
        this.data.tutorialStep = step;
        this.save();
    }

    setSpeed(speed) {
        this.data.speed = speed;
        this.save();
    }

    getStars(regionId) {
        return this.data.stars[regionId] || 0;
    }

    isRegionUnlocked(regionId) {
        return this.data.unlockedRegions.includes(regionId);
    }
}

export const saveStore = new SaveManager();
