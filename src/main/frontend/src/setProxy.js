// src/main/frontend/src/setProxy.js

/*
import { createProxyMiddleware } from "http-proxy-middleware";

export default function(app) {
	app.use(createProxyMiddleware("/api", {
		target: "http://localhost:8080/",
		changeOrigin: true,
	}));
};
*/

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    createProxyMiddleware('/api', {
      target: 'http://localhost:8080/',
      changeOrigin: true,
    })
  );
};