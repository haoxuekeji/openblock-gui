// Build/deploy scripts are modern node, so they need the es6 globals
// (Set, Map, Promise) that the repo-root config does not enable.
module.exports = {
    extends: ['scratch', 'scratch/es6', 'scratch/node'],
    rules: {
        // Build tooling, not library API. Full JSDoc and the function
        // expression style buy nothing for these one-off helpers, and
        // rewriting the declarations as expressions would change hoisting
        // in files that call helpers above their definition. Every
        // correctness rule stays on.
        'func-style': 'off',
        'require-jsdoc': 'off',
        'valid-jsdoc': 'off'
    }
};
