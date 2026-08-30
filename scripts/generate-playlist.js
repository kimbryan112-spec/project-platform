const fs = require("fs");
const path = require("path");

const musicFolder = path.join(__dirname, "../assets/Music");
const playlistFile = path.join(musicFolder, "playlist.json");

const files = fs.readdirSync(musicFolder);

console.log("All files:", files);

const playlist = files
    .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return [".mp3", ".wav"].includes(ext);
    })
    .sort((a, b) =>
        a.localeCompare(
            b,
            undefined,
            { numeric: true }
        )
    );

console.log("Filtered playlist:", playlist);

fs.writeFileSync(
    playlistFile,
    JSON.stringify(playlist, null, 4)
);

console.log(
    `✔ Generated playlist.json (${playlist.length} songs)`
);