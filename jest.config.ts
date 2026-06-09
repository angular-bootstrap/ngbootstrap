import type { Config } from 'jest';
import { createEsmPreset } from 'jest-preset-angular/presets/index.js';

const angularEsmPreset = createEsmPreset();

const config: Config = {
  ...angularEsmPreset,
  displayName: 'ngbootstrap',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'js', 'mjs', 'html'],
  coverageDirectory: '<rootDir>/coverage',
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  moduleNameMapper: {
    ...angularEsmPreset.moduleNameMapper,
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.(ts|mjs|js|html|svg)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
        useESM: true,
      },
    ],
  },
  snapshotSerializers: [],
};

export default config;
