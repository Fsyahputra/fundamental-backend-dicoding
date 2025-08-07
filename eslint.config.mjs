import daStyle from 'eslint-config-dicodingacademy';

export default [
  daStyle,

  {
    files: ['migrations/**/*.js'],
    rules: {
      camelcase: 'off',
    },
  },
  {
    ignores: ['dist/*'],
  },
];
