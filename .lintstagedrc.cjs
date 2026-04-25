const toScopedPaths = (files, scope) =>
  files
    .map((file) => file.replace(new RegExp(`^${scope}/`), ""))
    .filter((file) => file && !file.startsWith(`${scope}/`));

const join = (files) => files.map((file) => `"${file}"`).join(" ");

module.exports = {
  "front/src/**/*.{ts,js,html,css,scss}": (files) => {
    const scopedFiles = toScopedPaths(files, "front");
    if (!scopedFiles.length) return [];

    const args = join(scopedFiles);
    return [
      `npm --prefix front exec -- eslint --fix --max-warnings=0 --config front/eslint.config.mjs -- ${args}`,
      `npm --prefix front exec prettier --write -- ${args}`,
    ];
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
