import { expect } from "chai";
import { analyzeCSP } from "../dist/index.js";

// This file is .mjs since chai only exports as a module!

function formatCspStr(cspStr) {
  return cspStr.replace("; ", ";\n").trim();
}

describe("analyzeCSP", () => {
  const verifyCSPStatus = (directives, requiredDirectives) => {
    directives.forEach((directive) => { 
        const { directive: name, status, missingValues } = directive;
        if (requiredDirectives[name]) {
          expect(status).to.equal("fail");
          expect(missingValues).to.not.be.empty;
        }
      });
  }
  const verifyRevisedCsp = (revisedCSP, requiredDirectives) => {
    Object.keys(requiredDirectives).forEach((directiveName) => {
        requiredDirectives[directiveName].forEach((directiveValue) => {
          expect(revisedCSP).to.include(directiveValue);
        });
    })
  }
  it("should respond with no CSP correction when empty", () => {
    const csp = "";
    const result = analyzeCSP({ csp });
    expect(result.csp).to.equal(formatCspStr(csp));
    expect(result.results).to.be.an("array").that.is.empty;
    expect(result.revisedCSP).to.equal("");
  });

  it("should respond with no CSP correction when only non-impacting CSP directives present", () => {
    const csp =
      "base-uri 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'self'; manifest-src 'self'; media-src 'self'; navigate-to 'self'; object-src 'none'; prefetch-src 'self'; report-to https://your-csp-report-collector.com; require-trusted-types-for 'script'; trusted-types 'none'; upgrade-insecure-requests; sandbox allow-forms allow-scripts; block-all-mixed-content;";
    const result = analyzeCSP({ csp });
    expect(result.csp).to.equal(formatCspStr(csp));
    expect(result.results).to.be.an("array");
    expect(result.results).to.have.length(15);
    expect(result.revisedCSP).to.equal("");
  });

  it("should respond with default-src will all relevant values when its present and no other relevant directive is", () => {
    const csp = `default-src google.com;`;
    const result = analyzeCSP({ csp, hasData360: false, hasEngage: true });
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
    verifyCSPStatus(result.results, requiredDirectives);
    expect(result.revisedCSP).to.be.a("string").that.is.not.empty;
    verifyRevisedCsp(result.revisedCSP, requiredDirectives);
  });

  it("should respond with default-src will all relevant values when its present and no other relevant directive is except worker-src", () => {
    const csp = `default-src google.com; worker-src self blob:`;
    const result = analyzeCSP({ csp, hasData360: false, hasEngage: true });
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
    verifyCSPStatus(result.results, requiredDirectives);
    expect(result.revisedCSP).to.be.a("string").that.is.not.empty;
    verifyRevisedCsp(result.revisedCSP, requiredDirectives);
  });

  it("should respond with default-src will all relevant values when its present and no other relevant directive is except worker-src", () => {
    const csp = `default-src google.com; worker-src self blob:`;
    const result = analyzeCSP({ csp, hasData360: false, hasEngage: true });
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
    verifyCSPStatus(result.results, requiredDirectives);
    expect(result.revisedCSP).to.be.a("string").that.is.not.empty;
    verifyRevisedCsp(result.revisedCSP, requiredDirectives);
  });

  it("should respond with default-src, child-src will all relevant values when its present and no other relevant directive", () => {
    const csp = `default-src google.com; child-src google.com;`;
    const result = analyzeCSP({ csp, hasData360: false, hasEngage: true });
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
    verifyCSPStatus(result.results, requiredDirectives);
    expect(result.revisedCSP).to.be.a("string").that.is.not.empty;
    verifyRevisedCsp(result.revisedCSP, requiredDirectives);
  });
});
