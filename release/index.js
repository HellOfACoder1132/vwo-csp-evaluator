"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCspAnalysis = exports.getCspFromMeta = exports.getCspFromLink = void 0;
var axios_1 = __importDefault(require("axios"));
var constants_1 = __importDefault(require("./constants"));
var cheerio_1 = require("cheerio");
var messageHelper_1 = require("./messageHelper");
// const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
// const isBrowser = typeof window === "object" && typeof window.document === "object";
var getCspAnalysis = function (_a) {
    var _b, _c, _d, _e, _f, _g, _h;
    var csp = _a.csp, hasData360 = _a.hasData360, hasEngage = _a.hasEngage;
    if (!csp) {
        return { csp: "", results: [], revisedCSP: "" };
    }
    var directivesToFormattedCsp = function (directives) {
        return directives.join(";\n");
    };
    var directives = csp
        .split(";")
        .map(function (d) { return d.trim(); })
        .filter(Boolean);
    var vwoDomains = ["*.visualwebsiteoptimizer.com", "app.vwo.com"];
    var requiredDirectives = (_b = {},
        _b[constants_1.default.CSP.DIRECTIVES.WORKER_SRC] = ["'self'", "blob:"],
        _b["style-src"] = __spreadArray(["'unsafe-inline'"], vwoDomains, true),
        _b["default-src"] = [],
        _b["child-src"] = [],
        _b["img-src"] = __spreadArray(__spreadArray([], vwoDomains, true), [constants_1.default.USER_UPLOADS_DOMAIN], false),
        _b["connect-src"] = vwoDomains,
        _b["frame-src"] = vwoDomains,
        _b["script-src"] = [],
        _b["script-src-elem"] = [
            "'unsafe-inline'",
            {
                regex: /(?:dev|\*)\.visualwebsiteoptimizer\.com/,
                value: vwoDomains[0],
            },
        ],
        _b);
    if (!hasData360) {
        requiredDirectives["script-src-elem"].push("'unsafe-eval'");
    }
    if (hasEngage) {
        requiredDirectives["script-src-elem"].push(constants_1.default.VWO_ENGAGE_CDN);
        requiredDirectives["style-src"].push(constants_1.default.VWO_ENGAGE_CDN);
    }
    var cspDirectiveMap = directives.reduce(function (map, directive) {
        var _a = directive.split(" "), name = _a[0], values = _a.slice(1);
        map[name] = values;
        return map;
    }, {});
    var isDirectivePresent = function (directive) {
        return !!cspDirectiveMap[directive];
    };
    var isPresent = (_c = {
            "script-src-elem": isDirectivePresent("script-src-elem"),
            "script-src": isDirectivePresent("script-src"),
            "script-src*": isDirectivePresent("script-src") && isDirectivePresent("script-src-elem")
        },
        _c[constants_1.default.CSP.DIRECTIVES.WORKER_SRC] = isDirectivePresent(constants_1.default.CSP.DIRECTIVES.WORKER_SRC),
        _c["connect-src"] = isDirectivePresent("connect-src"),
        _c["frame-src"] = isDirectivePresent("frame-src"),
        _c["img-src"] = isDirectivePresent("img-src"),
        _c["style-src"] = isDirectivePresent("style-src"),
        _c["child-src"] = isDirectivePresent("child-src"),
        _c["default-src"] = isDirectivePresent("default-src"),
        _c);
    if (!isPresent["script-src-elem"]) {
        (_d = requiredDirectives["script-src"]).push.apply(_d, requiredDirectives["script-src-elem"]);
    }
    if (!isPresent[constants_1.default.CSP.DIRECTIVES.WORKER_SRC]) {
        var workerSrcValues = requiredDirectives[constants_1.default.CSP.DIRECTIVES.WORKER_SRC];
        if (isPresent["script-src"]) {
            (_e = requiredDirectives["script-src"]).push.apply(_e, workerSrcValues);
        }
        else if (isPresent["child-src"]) {
            (_f = requiredDirectives["child-src"]).push.apply(_f, workerSrcValues);
        }
        else if (isPresent["default-src"]) {
            (_g = requiredDirectives["default-src"]).push.apply(_g, workerSrcValues);
        }
    }
    if (!isPresent["script-src*"]) {
        requiredDirectives["script-src"].forEach(function (directiveVal) {
            if (typeof directiveVal === "object")
                directiveVal = directiveVal.value;
            requiredDirectives["default-src"].push(directiveVal);
        });
    }
    if (isPresent["default-src"] &&
        (!isPresent["img-src"] ||
            !isPresent["connect-src"] ||
            // If neither script-src nor script-src-elem is present, then add the VWO domains to default-src!
            (!isPresent["script-src"] && !isPresent["script-src-elem"]) ||
            !(isPresent["frame-src"] && isPresent["child-src"]))) {
        (_h = requiredDirectives["default-src"]).push.apply(_h, vwoDomains);
    }
    if (isPresent["default-src"] && !isPresent["img-src"]) {
        requiredDirectives["default-src"].push(constants_1.default.USER_UPLOADS_DOMAIN);
    }
    var isCspValid = true;
    var results = directives.map(function (directive) {
        var directiveStr = directive.replace("https://", "");
        var _a = directiveStr.split(" "), directiveName = _a[0], values = _a.slice(1);
        var requiredValues = requiredDirectives[directiveName];
        if (!requiredValues || !requiredValues.length) {
            return { directive: directiveName, status: "pass", missingValues: [] };
        }
        var missingValues = [];
        var messageList = [];
        for (var _i = 0, requiredValues_1 = requiredValues; _i < requiredValues_1.length; _i++) {
            var requiredVal = requiredValues_1[_i];
            if (typeof requiredVal === "object"
                ? !directiveStr.match(requiredVal.regex)
                : !values.includes(requiredVal)) {
                var requiredValue = typeof requiredVal === "object" ? requiredVal.value : requiredVal;
                missingValues.push(requiredValue);
                messageList.push([requiredValue, (0, messageHelper_1.findMessageForDirective)(directiveName, requiredValue)]);
            }
        }
        if (missingValues.length)
            isCspValid = false;
        return {
            directive: directiveName,
            status: missingValues.length === 0 ? "pass" : "fail",
            missingValues: missingValues,
            messageList: messageList
        };
    });
    var revisedCSPMap = __assign({}, cspDirectiveMap);
    results.forEach(function (result) {
        if (result.status === "fail") {
            revisedCSPMap[result.directive] = __spreadArray(__spreadArray([], (revisedCSPMap[result.directive] || []), true), result.missingValues, true);
        }
    });
    var revisedCSP = isCspValid
        ? ""
        : Object.entries(revisedCSPMap)
            .map(function (_a) {
            var directive = _a[0], values = _a[1];
            return "".concat(directive, " ").concat(values.join(" "));
        })
            .join(";\n");
    var formattedCspStr = directivesToFormattedCsp(directives) + (directives.length ? ";" : "");
    return {
        csp: formattedCspStr,
        results: results,
        revisedCSP: revisedCSP,
    };
};
exports.getCspAnalysis = getCspAnalysis;
var getCspFromMeta = function (metaTagEle) {
    var cspContent = "";
    if (metaTagEle &&
        typeof metaTagEle === "object" &&
        "nodeType" in metaTagEle &&
        "tagName" in metaTagEle) {
        // Retrieve the content attribute of the meta tag
        cspContent = metaTagEle.getAttribute("content") || cspContent;
    }
    return cspContent;
};
exports.getCspFromMeta = getCspFromMeta;
var getCspFromLink = function (url_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([url_1], args_1, true), void 0, function (url, configObj) {
        var getCSPFromHeaders, getCSPFromMetaOfCurrentDOM, csp, statusCode, response, cspFromMeta, e_1;
        if (configObj === void 0) { configObj = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    getCSPFromHeaders = function (headers) {
                        return (headers["content-security-policy"] ||
                            headers["Content-Security-Policy"] ||
                            "");
                    };
                    getCSPFromMetaOfCurrentDOM = function (html) {
                        var $ = (0, cheerio_1.load)(html);
                        return ($('meta[http-equiv="Content-Security-Policy"]').attr("content") || "");
                    };
                    csp = "";
                    statusCode = 404;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.get(url)];
                case 2:
                    response = _a.sent();
                    csp = getCSPFromHeaders(response.headers);
                    statusCode = response.status;
                    if (!csp && configObj.metaFallback) {
                        cspFromMeta = getCSPFromMetaOfCurrentDOM(response.data);
                        csp = cspFromMeta || csp;
                    }
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    return [2 /*return*/, { csp: "", statusCode: 500 }];
                case 4: return [2 /*return*/, { csp: csp, statusCode: statusCode }];
            }
        });
    });
};
exports.getCspFromLink = getCspFromLink;
