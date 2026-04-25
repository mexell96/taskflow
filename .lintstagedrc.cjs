const toScopedPaths = (files, scope) =>
  files
    .map((file) => file.replace(new RegExp(`^${scope}/`), ""))
    .filter((file) => file && !file.startsWith(`${scope}/`));

const join = (files) => files.map((file) => `"${file}"`).join(" ");

module.exports = {
  "front/src/**/*.{ts,js,html,css,scss}": (files) => {
    const scopedFiles = toScopedPaths(files, "front");
    if (!scopedFiles.length) return [];

    const eslintFiles = scopedFiles.filter((file) => /\.(ts|js)$/.test(file));
    const prettierArgs = join(scopedFiles);
    const commands = [`npm --prefix front exec prettier --write -- ${prettierArgs}`];
    if (eslintFiles.length) {
      const eslintArgs = join(eslintFiles);
      commands.unshift(
        `npm --prefix front exec -- eslint --fix --max-warnings=0 --config front/eslint.config.mjs -- ${eslintArgs}`,
      );
    }
    return commands;
  },
  "back/{src,test}/**/*.{ts,js}": (files) => {
    const scopedFiles = toScopedPaths(files, "back");
    if (!scopedFiles.length) return [];

    const args = join(scopedFiles);
    return [
      `npm --prefix back exec -- eslint --fix --max-warnings=0 --config back/eslint.config.mjs -- ${args}`,
      `npm --prefix back exec prettier --write -- ${args}`,
    ];
  },
  "**/*.{json,md,yml,yaml}": ["prettier --write"],
};
