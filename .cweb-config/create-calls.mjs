import fsSync from "fs";
import yaml from "js-yaml";
import path from "path";

const workdirPath = process.cwd();

// Define a custom tag for including external YAML files
const extendedSchema = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type("!include", {
    kind: "scalar",
    resolve: function (data) {
      return typeof data === "string";
    },
    construct: function (filePath) {
      try {
        const content = fsSync.readFileSync(filePath, "utf8");
        return yaml.load(content, { schema: yaml.DEFAULT_SCHEMA });
      } catch (error) {
        console.log("\n");
        console.log("Did you forget to build your contract modules?");
        console.log("Run \x1b[36myarn build\x1b[0m before deploying.");
        console.log("\n");

        console.error(error);
        process.exit(-1);
      }
    },
  }),
]);

const callsTemplateJSON = yaml.load(
  fsSync.readFileSync(
    path.join(workdirPath, "/.cweb-config/calls-template.yaml"),
    "utf8"
  ),
  { schema: extendedSchema }
);

fsSync.writeFileSync(
  path.join(workdirPath, "/.cweb-config/calls.yaml"),
  yaml.dump(callsTemplateJSON),
  { encoding: "utf8" }
);
