/** @type {import('next').NextConfig} */

const { version } = require('./package.json');

const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    isLocal: process.env.MONGODB_URI.includes("italy"),
    platform1: "softicketsmanager|mpas->...1|gpas->...!",
    platform2: "mahindersinghitaly|Rp1",
    version: version,
  },
};

module.exports = nextConfig;
