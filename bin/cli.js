#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: npx djs-test-utils init <command-file>

Generates a starter test file for an existing command module.
`);
  process.exit(0);
}

if (args[0] !== "init") {
  console.error(`Unknown command "${args[0]}". Use "init <command-file>".`);
  process.exit(1);
}

const commandPath = args[1];
if (!commandPath) {
  console.error("Error: missing path to a command file.");
  process.exit(1);
}

const resolvedPath = path.resolve(process.cwd(), commandPath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`Error: command file not found at ${resolvedPath}`);
  process.exit(1);
}

const commandName = path.basename(resolvedPath, path.extname(resolvedPath));
const testFileName = `${commandName}.test.js`;
const outputDir = path.dirname(resolvedPath);
const outputPath = path.join(outputDir, testFileName);

if (fs.existsSync(outputPath)) {
  console.error(`Error: test file already exists at ${outputPath}`);
  process.exit(1);
}

const relativeImport = `./${commandName}${path.extname(resolvedPath)}`;
const content = `import { describe, it, expect } from "vitest";
import { MockInteraction, mockMember } from "djs-test-utils";
import { ${commandName} } from "${relativeImport}";

describe("${commandName}", () => {
  it("works as expected", async () => {
    const interaction = new MockInteraction({
      commandName: "${commandName}",
      options: {},
      member: mockMember({ permissionFlags: ["Administrator"] }),
    });

    await ${commandName}(interaction);

    expect(interaction.replied || interaction.deferred).toBe(true);
  });
});
`;

fs.writeFileSync(outputPath, content, "utf8");
console.log(`Created starter test file: ${outputPath}`);
process.exit(0);
