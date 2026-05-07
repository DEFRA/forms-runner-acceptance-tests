import neostandard from 'neostandard'
import jsdoc from 'eslint-plugin-jsdoc'

export default [
  ...neostandard({
    noStyle: true
  }),

  jsdoc.configs['flat/recommended'],
  {
    ignores: ['playwright-report/**']
  }
]
