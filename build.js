import fs from "fs";
import * as sass from "sass";
import { fileURLToPath } from "url";
import { dirname, join, basename } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sassFiles = [
	join(__dirname, "sass", "alignment.scss"),
	join(__dirname, "sass", "border.scss"),
	join(__dirname, "sass", "flexbox.scss"),
	join(__dirname, "sass", "form.scss"),
	join(__dirname, "sass", "gap.scss"),
	join(__dirname, "sass", "grid.scss"),
	join(__dirname, "sass", "helper.scss"),
	join(__dirname, "sass", "layout.scss"),
	join(__dirname, "sass", "main.scss"),
	join(__dirname, "sass", "position.scss"),
	join(__dirname, "sass", "reset.scss"),
	join(__dirname, "sass", "spacing.scss"),
	join(__dirname, "sass", "transition.scss"),
	join(__dirname, "sass", "typography.scss"),
];

const outputDir = join(__dirname, "dist");

const log = async (type, message) => {
	const timestamp = new Date().toLocaleTimeString("pt-BR", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});

	const colors = {
		info: "\x1b[34m",
		error: "\x1b[31m",
		success: "\x1b[32m",
		log: "\x1b[33m",
	};

	const resetColor = "\x1b[0m";

	let typeTag;
	let color;

	switch (type) {
		case "info":
			typeTag = "Info:";
			color = colors.info;
			break;
		case "error":
			typeTag = "Error:";
			color = colors.error;
			break;
		case "success":
			typeTag = "Success:";
			color = colors.success;
			break;
		default:
			typeTag = "Log:";
			color = colors.log;
	}

	console.log(`${timestamp} ${color}${typeTag}${resetColor} ${message}`);
};

const ensureDirectoryExistence = async (filePath) => {
	const dir = dirname(filePath);
	try {
		await fs.promises.access(dir, fs.constants.F_OK);
	} catch {
		await fs.promises.mkdir(dir, { recursive: true });
	}
};

const compileSass = async (filePath, outputPath, options) => {
	try {
		const result = sass.compile(filePath, {
			style: options.minify ? "compressed" : "expanded",
			sourceMap: options.sourceMap,
		});

		await ensureDirectoryExistence(outputPath);

		let cssData = result.css;
		if (typeof cssData !== "string") {
			cssData = JSON.stringify(cssData);
		}
		await fs.promises.writeFile(outputPath, cssData, "utf8");

		if (options.sourceMap && result.sourceMap) {
			let sourceMapData = result.sourceMap;
			if (
				typeof sourceMapData !== "string" &&
				!Buffer.isBuffer(sourceMapData)
			) {
				sourceMapData = JSON.stringify(sourceMapData);
			}
			await fs.promises.writeFile(`${outputPath}.map`, sourceMapData, "utf8");
		}

		log("success", `Sass compiled to ${outputPath}`);
	} catch (error) {
		log("error", `Error compiling Sass: ${error}`);
	}
};

const run = async () => {
	try {
		for (const filePath of sassFiles) {
			const fileName = basename(filePath, ".scss");

			const minifiedOutputPath = join(
				outputDir,
				"compressed",
				`${fileName}.css`,
			);
			const expandedOutputPath = join(outputDir, "expanded", `${fileName}.css`);

			await compileSass(filePath, minifiedOutputPath, {
				minify: true,
				sourceMap: false,
			});
			await compileSass(filePath, expandedOutputPath, {
				minify: false,
				sourceMap: true,
			});
		}

		log("success", "Compilation process completed successfully.");
	} catch (error) {
		log("error", `Error in the compilation process: ${error}`);
	}
};

run().catch((error) => {
	log("error", `Error in the overall process: ${error}`);
});
