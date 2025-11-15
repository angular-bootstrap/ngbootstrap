# @ngbootstrap (standalone library)

This folder now contains everything needed to build and publish the `@ngbootstrap`
Angular library outside of the Nx workspace. It uses `ng-packagr` directly, so you
can copy the folder into its own repository and continue working without Nx.

## Local development

```bash
cd ngbootstrap
npm install
npm run lint
npm run build
```

- The build artefacts end up in `ngbootstrap/dist/ngbootstrap`.
- `npm run test` executes the Jest setup provided by `jest-preset-angular`.

## Publishing

After running `npm run build`, publish the generated package:

```bash
cd dist/ngbootstrap
npm publish --access public
```

Feel free to rename the package in `package.json` if you plan to publish under
a different scope.
