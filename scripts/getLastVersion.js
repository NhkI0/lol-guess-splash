const DATABASE_URL = "https://raw.communitydragon.org"

export async function getLastVersion() {
    try {
        const response = await fetch(DATABASE_URL);
        const html = await response.text();
        const regex =
            /<tr><td class="link"><a href="([^"]+)" title="(\d+\.\d+)">([^<]+)<\/a><\/td><td class="size">([^<]+)<\/td><td class="date">([^<]+)<\/td><\/tr>/g;

        const matches = [...html.matchAll(regex)];
        const titles = [...html.matchAll(regex)].map(match => match[2]); // Retrieve titles only

        let lastSeason = "16.2"

        for (const title of titles) {
            if (parseInt(title.split(".")[0]) > parseInt(lastSeason.split(".")[0])) {
                lastSeason = title;
            }else
                if (parseInt(title.split(".")[0]) === parseInt(lastSeason.split(".")[0])) {
                    if (parseInt(title.split(".")[1]) > parseInt(lastSeason.split(".")[1])) {
                        lastSeason = title;
                }
            }
        }
        return lastSeason;
    }
    catch (error) {
        return "16.1";
    }
}
