import { expect } from "chai";
import { getCspAnalysis } from "../dist/index.js";

// This file is .mjs since chai only exports as a module!

function formatCspStr(cspStr) {
  return cspStr.replaceAll("; ", ";\n").trim();
}

const utils = {
  verifyCSPStatus(directives, requiredDirectives) {
    directives.forEach((directive) => { 
      const { directive: name, status, missingValues } = directive;
      if (requiredDirectives[name]) {
        expect(status).to.equal("fail");
        expect(missingValues).to.not.be.empty;
      }
    });
  },

  verifyRevisedCsp(revisedCSP, requiredDirectives) {
    Object.keys(requiredDirectives).forEach((directiveName) => {
      requiredDirectives[directiveName].forEach((directiveValue) => {
        expect(revisedCSP).to.include(directiveValue);
      });
    });
  },

  verifyIfCspResultIsCorrect(result) {
    expect(result.revisedCSP).to.be.a("string").that.is.empty;
    result.results.forEach((entry) => {
      expect(entry.status).to.be.equal('pass');
      expect(entry.missingValues).to.be.a('array').that.is.empty;
    });
  }
};


describe("getCspAnalysis", () => {
  it("should respond with no CSP correction when empty", () => {
    const csp = "";
    const result = getCspAnalysis({ csp });
    expect(result.csp).to.equal(formatCspStr(csp));
    expect(result.results).to.be.an("array").that.is.empty;
    expect(result.revisedCSP).to.equal("");
  });

  it("should respond with no CSP correction when only non-impacting CSP directives present", () => {
    const csp =
      "base-uri 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'self'; manifest-src 'self'; media-src 'self'; navigate-to 'self'; object-src 'none'; prefetch-src 'self'; report-to https://your-csp-report-collector.com; require-trusted-types-for 'script'; trusted-types 'none'; upgrade-insecure-requests; sandbox allow-forms allow-scripts; block-all-mixed-content;";
    const result = getCspAnalysis({ csp });
    expect(result.csp).to.equal(formatCspStr(csp));
    expect(result.results).to.be.an("array");
    expect(result.results).to.have.length(15);
    expect(result.revisedCSP).to.equal("");
  });

  it("should respond with default-src will all relevant values when its present and no other relevant directive is", () => {
    const csp = `default-src google.com;`;
    const result = getCspAnalysis({ csp, hasData360: false, hasEngage: true });
    expect(result.csp).to.equal(csp.trim());
    expect(result.results).to.be.an("array").that.is.not.empty;
    // Check that all required directives are present and their values are as expected
    const requiredDirectives = {
      "default-src": [
        "'self'",
        "blob:",
        "'unsafe-eval'",
        "'unsafe-inline'",
        "*.visualwebsiteoptimizer.com",
        "app.vwo.com",
        "cdn.pushcrew.com",
      ],
    };
    utils.verifyCSPStatus(result.results, requiredDirectives);
    expect(result.revisedCSP).to.be.a("string").that.is.not.empty;
    utils.verifyRevisedCsp(result.revisedCSP, requiredDirectives);
  });

  it("should respond with default-src will all relevant values when its present and no other relevant directive is except worker-src", () => {
    const csp = `default-src google.com; worker-src self blob:`;
    const result = getCspAnalysis({ csp, hasData360: false, hasEngage: true });
    expect(result.results).to.be.an("array").that.is.not.empty;
    // Check that all required directives are present and their values are as expected
    const requiredDirectives = {
      "default-src": [
        "'unsafe-eval'",
        "'unsafe-inline'",
        "*.visualwebsiteoptimizer.com",
        "app.vwo.com",
        "cdn.pushcrew.com",
      ],
    };
    utils.verifyCSPStatus(result.results, requiredDirectives);
    expect(result.revisedCSP).to.be.a("string").that.is.not.empty;
    utils.verifyRevisedCsp(result.revisedCSP, requiredDirectives);
  });

  it("should respond with default-src will all relevant values when its present and no other relevant directive is except worker-src", () => {
    const csp = `default-src google.com; worker-src self blob:`;
    const result = getCspAnalysis({ csp, hasData360: false, hasEngage: true });
    expect(result.results).to.be.an("array").that.is.not.empty;
    // Check that all required directives are present and their values are as expected
    const requiredDirectives = {
      "default-src": [
        "'unsafe-eval'",
        "'unsafe-inline'",
        "*.visualwebsiteoptimizer.com",
        "app.vwo.com",
        "cdn.pushcrew.com",
      ],
    };
    utils.verifyCSPStatus(result.results, requiredDirectives);
    expect(result.revisedCSP).to.be.a("string").that.is.not.empty;
    utils.verifyRevisedCsp(result.revisedCSP, requiredDirectives);
  });

  it("should respond with default-src, child-src will all relevant values when its present and no other relevant directive", () => {
    const csp = `default-src google.com; child-src google.com;`;
    const result = getCspAnalysis({ csp, hasData360: false, hasEngage: true });
    expect(result.results).to.be.an("array").that.is.not.empty;
    // Check that all required directives are present and their values are as expected
    const requiredDirectives = {
    "child-src": [
        "'self'",
        "blob:",
        ],
      "default-src": [
        "'unsafe-eval'",
        "'unsafe-inline'",
        "*.visualwebsiteoptimizer.com",
        "app.vwo.com",
        "cdn.pushcrew.com",
      ],
    };
    utils.verifyCSPStatus(result.results, requiredDirectives);
    expect(result.revisedCSP).to.be.a("string").that.is.not.empty;
    utils.verifyRevisedCsp(result.revisedCSP, requiredDirectives);
  });

  it("should respond with correctly populated values for each of the CSP key", () => {
    const csp = `default-src google.com; img-src google.com; connect-src google.com; style-src google.com; frame-src google.com; script-src-elem google.com;`;
    const result = getCspAnalysis({ csp, hasData360: false, hasEngage: true });
    const requiredDirectives = {
      "default-src": [
        "'unsafe-eval'",
        "'unsafe-inline'",
        "*.visualwebsiteoptimizer.com",
        "app.vwo.com",
        "cdn.pushcrew.com",
      ],
      "img-src": [
        "*.visualwebsiteoptimizer.com",
        "app.vwo.com",
        "useruploads.vwo.io"
      ],
      "connect-src": [
        "*.visualwebsiteoptimizer.com",
        "app.vwo.com"
      ],
      "style-src": [
        'unsafe-inline',
        "*.visualwebsiteoptimizer.com",
        "app.vwo.com"
      ],
      "frame-src": [
        "*.visualwebsiteoptimizer.com",
        "app.vwo.com"
      ],
      "script-src-elem": [
        "*.visualwebsiteoptimizer.com",
        "app.vwo.com"
      ]
    };
    utils.verifyCSPStatus(result.results, requiredDirectives);
    expect(result.revisedCSP).to.be.a("string").that.is.not.empty;
    utils.verifyRevisedCsp(result.revisedCSP, requiredDirectives);
  });

  it("should respond return empty array in case everything's correct", () => {
    const csp = `default-src google.com 'self' blob: *.visualwebsiteoptimizer.com app.vwo.com; img-src google.com *.visualwebsiteoptimizer.com app.vwo.com useruploads.vwo.io; connect-src google.com *.visualwebsiteoptimizer.com app.vwo.com; style-src google.com 'unsafe-inline' *.visualwebsiteoptimizer.com app.vwo.com; frame-src google.com *.visualwebsiteoptimizer.com app.vwo.com; script-src-elem google.com 'unsafe-inline' *.visualwebsiteoptimizer.com 'unsafe-eval' cdn.pushcrew.com`;
    const result = getCspAnalysis({ csp, hasData360: false, hasEngage: false });
    utils.verifyIfCspResultIsCorrect(result);
  });

  it("script-src-elem should not contain unsafe-eval for data360 mode", () => {
    const csp = `default-src 'self' blob: google.com app.vwo.com useruploads.vwo.io; script-src-elem 'self' google.com`;
    const result = getCspAnalysis({ csp, hasData360: true });
    const requiredDirectives = {
      "default-src": [
        "'unsafe-inline'",
        "*.visualwebsiteoptimizer.com",
        "app.vwo.com",
        "useruploads.vwo.io"
      ],
      "script-src-elem": [
        "'unsafe-inline'",
        "*.visualwebsiteoptimizer.com"
      ]
    };
    utils.verifyCSPStatus(result.results, requiredDirectives);
    expect(result.revisedCSP).to.be.a("string").that.is.not.empty;
    utils.verifyRevisedCsp(result.revisedCSP, requiredDirectives);
  });

  it("should not override the `visualwebsiteoptimizer` domain from script-src-elem", () => {
    const csp = `default-src 'self' blob: google.com 'unsafe-inline' *.visualwebsiteoptimizer.com app.vwo.com useruploads.vwo.io; script-src-elem 'self' 'unsafe-inline' google.com dev.visualwebsiteoptimizer.com`;
    const result = getCspAnalysis({ csp, hasData360: true });
    utils.verifyIfCspResultIsCorrect(result);
  });
});
