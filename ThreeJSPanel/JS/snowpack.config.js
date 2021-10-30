module.exports = {
    plugins: [
        ['@snowpack/plugin-optimize']
    ],
    root: './',
    buildOptions: {
        out: '../wwwroot/js',
        clean: true
    },
    exclude: ["*.js"],

    mount: {
        'src': '/'
    },
};