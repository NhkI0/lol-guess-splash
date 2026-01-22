const DATABASE_URL = "https://raw.communitydragon.org"
const CACHE_KEY = "lol_version_cache";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const FALLBACK_VERSION = "16.2";

export async function getLastVersion() {
    if (typeof window !== "undefined") {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { version, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) {
                return version;
            }
        }
    }

    try {
        const response = await fetch(DATABASE_URL);
        const html = await response.text();
        const regex =
            /<tr><td class="link"><a href="([^"]+)" title="(\d+\.\d+)">([^<]+)<\/a><\/td><td class="size">([^<]+)<\/td><td class="date">([^<]+)<\/td><\/tr>/g;

        const titles = [...html.matchAll(regex)].map(match => match[2]);

        let lastSeason = FALLBACK_VERSION;

        for (const title of titles) {
            if (parseInt(title.split(".")[0]) > parseInt(lastSeason.split(".")[0])) {
                lastSeason = title;
            } else if (parseInt(title.split(".")[0]) === parseInt(lastSeason.split(".")[0])) {
                if (parseInt(title.split(".")[1]) > parseInt(lastSeason.split(".")[1])) {
                    lastSeason = title;
                }
            }
        }
        
        if (typeof window !== "undefined") {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                version: lastSeason,
                timestamp: Date.now()
            }));
        }

        return lastSeason;
    } catch (error) {
        return FALLBACK_VERSION;
    }
}
