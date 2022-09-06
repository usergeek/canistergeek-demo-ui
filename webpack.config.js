const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const WebpackBar = require("webpackbar");

const LOCAL_II_URL = "http://rrkah-fqaaa-aaaaa-aaaaq-cai.localhost:8000"

const isDevelopment = process.env.NODE_ENV !== "production";

const frontendDirectory = "landing_assets";
const frontendDirectoryPath = path.join("src", frontendDirectory);

const asset_entry = path.join(frontendDirectoryPath, "src", "index.html");

module.exports = {
    target: "web",
    mode: isDevelopment ? "development" : "production",
    entry: {
        index: path.join(__dirname, asset_entry).replace(/\.html$/, ".jsx")
    },
    devtool: isDevelopment ? "source-map" : false,
    optimization: {
        minimize: !isDevelopment,
        minimizer: [
            new TerserPlugin(),
            new CssMinimizerPlugin()
        ],
        splitChunks: {
            cacheGroups: {
                vendor: {
                    name: "node_vendors",
                    test: /[\\/]node_modules[\\/]/,
                    chunks: "all",
                },
            },
        }
    },
    resolve: {
        extensions: [".js", ".ts", ".jsx", ".tsx"],
        fallback: {
            assert: require.resolve("assert/"),
            buffer: require.resolve("buffer/"),
            events: require.resolve("events/"),
            stream: require.resolve("stream-browserify/"),
            util: require.resolve("util/"),
        },
        modules: [
            path.resolve('./node_modules'),
            path.resolve('./')
        ],
    },
    output: {
        filename: "[name].[contenthash].bundle.js",
        path: path.join(__dirname, "dist", frontendDirectory),
        publicPath: "/",
    },
    module: {
        rules: [
            {test: /\.(ts|tsx|jsx)$/, loader: "ts-loader"},
            {test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader']},
            {
                test: /\.(png|svg)$/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 6 * 1024,
                    },
                },
            },
            {
                test: /\.less$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    {
                        loader: "less-loader",
                        options: {
                            lessOptions: {
                                javascriptEnabled: true,
                                paths: [
                                    path.resolve(__dirname, "node_modules"),
                                    path.resolve(__dirname, frontendDirectoryPath, "src", "css"),
                                ]
                            },
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new WebpackBar({profile: true}),
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
            chunkFilename: '[id].[contenthash].css',
        }),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, asset_entry),
            cache: false
        }),
        new webpack.EnvironmentPlugin({
            NODE_ENV: "development",
            II_URL: isDevelopment ? LOCAL_II_URL : "https://identity.ic0.app",
            NFID_II_URL: "https://nfid.one/authenticate/?applicationName=Canistergeek&applicationLogo=https%3A%2F%2Fxcxtd-2qaaa-aaaah-qabfa-cai.raw.ic0.app%2Ffavicon-64.svg#authorize",
        }),
        new webpack.ProvidePlugin({
            Buffer: [require.resolve("buffer/"), "Buffer"],
            process: require.resolve("process/browser"),
        }),
    ],
    // proxy /api to port 8000 during development
    devServer: {
        proxy: {
            "/api": {
                target: "http://localhost:8000",
                changeOrigin: true,
                pathRewrite: {
                    "^/api": "/api",
                },
            },
        },
        port: 3001,
        hot: true,
        host: "0.0.0.0",
        watchFiles: [path.resolve(__dirname, frontendDirectoryPath)],
        liveReload: true,
        historyApiFallback: true,
    },
};
