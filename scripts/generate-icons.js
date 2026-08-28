const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const source = path.join(__dirname, "../assets/images/kbhfilms-logo.png");
const outputDir = path.join(__dirname, "../assets/icons");

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const sizes = [48, 72, 96, 128, 144, 152, 192, 256, 384, 512];

(async () => {

    for (const size of sizes) {

        const output = path.join(outputDir, `icon-${size}.png`);

        // Skip kung existing na
        if (fs.existsSync(output)) {

            console.log(`⏭ Skipped icon-${size}.png (already exists)`);

            continue;

        }

        await sharp(source)
            .resize(size, size, {
                fit: "contain",
                background: {
                    r: 0,
                    g: 0,
                    b: 0,
                    alpha: 0
                }
            })
            .png()
            .toFile(output);

        console.log(`✔ Created icon-${size}.png`);

    }

    console.log("Done!");

})();