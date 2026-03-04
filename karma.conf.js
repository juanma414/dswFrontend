// Karma configuration file for running tests

module.exports = function(config) {
  const path = require('path');
  const fs = require('fs');
  
  let chromiumPath = null;
  let browsers = ['Chrome'];
  let customLaunchers = {};

  // Estrategia 1: Usar variable de entorno CHROME_BIN si existe
  if (process.env.CHROME_BIN) {
    chromiumPath = process.env.CHROME_BIN;
    console.log('✓ CHROME_BIN detectado:', chromiumPath);
  }
  
  // Estrategia 2: Intentar cargar puppeteer.executablePath()
  if (!chromiumPath) {
    try {
      const puppeteer = require('puppeteer');
      const path = puppeteer.executablePath();
      if (path && fs.existsSync(path)) {
        chromiumPath = path;
        console.log('✓ Puppeteer Chromium encontrado en:', chromiumPath);
      }
    } catch (e) {
      console.warn('⚠ No se pudo cargar Puppeteer');
    }
  }

  // Si encontramos Chromium, configurarlo
  if (chromiumPath && fs.existsSync(chromiumPath)) {
    browsers = ['ChromeCustom'];
    customLaunchers.ChromeCustom = {
      base: 'Chrome',
      executablePath: chromiumPath,
      flags: [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer',
        '--disable-extensions'
      ]
    };
    console.log('✓ Configuración de Chrome personalizado lista');
  } else {
    console.warn('⚠ Chromium no encontrado, usando Chrome del sistema');
  }

  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        random: false,
        stopSpecOnExpectationFailure: false
      },
      clearContext: false
    },
    jasmineHtmlReporter: {
      suppressAll: true
    },
    coverageReporter: {
      dir: path.join(__dirname, './coverage/dsw-frontend'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: browsers,
    customLaunchers: customLaunchers,
    singleRun: false,
    restartOnFileChange: true,
    browserDisconnectTimeout: 15000,
    browserNoActivityTimeout: 60000,
    captureTimeout: 60000,
    concurrency: Infinity
  });
};
