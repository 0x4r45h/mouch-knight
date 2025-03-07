import { loadEnvConfig } from '@next/env';
import path from 'path';

// Load environment variables from the project root
const projectDir = process.cwd();
loadEnvConfig(projectDir, true);

// Parse command-line arguments to get the target script file
const scriptFlagIndex = process.argv.indexOf("--script");
if (scriptFlagIndex === -1 || !process.argv[scriptFlagIndex + 1]) {
    console.error("Usage: pnpm run <command> --script <script-file-path>");
    process.exit(1);
}

const scriptArg = process.argv[scriptFlagIndex + 1];
const resolvedScriptPath = path.resolve(process.cwd(), scriptArg);

(async () => {
    try {
        const script = await import(resolvedScriptPath);
        // If the module exports a default function, invoke it.
        if (script && typeof script.default === 'function') {
            await script.default();
        } else {
            console.log("Module loaded but no default export function found.");
        }
    } catch (error) {
        console.error("Error executing script:", error);
        process.exit(1);
    }
})();