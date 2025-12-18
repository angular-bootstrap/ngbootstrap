import type { Config } from 'jest';
import { createEsmPreset } from 'jest-preset-angular/presets';

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
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};

export default config;
