"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMessageForDirective = void 0;
var constants_1 = __importDefault(require("./constants"));
var messageStore = (_a = {
        "script-src-elem": [
            {
                value: "'unsafe-inline'",
                msg: "the inline script tags will cease to function causing loading issues in VWO",
                criticality: "high"
            },
            {
                regex: /(?:dev|\*)\.visualwebsiteoptimizer\.com/,
                msg: "the scripts required for running VWO will not be loaded",
                criticality: "high"
            },
            {
                value: constants_1.default.VWO_ENGAGE_CDN,
                msg: "the script tags required for loading VWO Engage will fease to function",
                criticality: "medium"
            },
            {
                value: "'unsafe-eval'",
                msg: "the absence of this directive will cause issues in VWO's functioning",
                criticality: "high"
            },
        ],
        "script-src": ["script-src-elem", constants_1.default.CSP.DIRECTIVES.WORKER_SRC]
    },
    _a[constants_1.default.CSP.DIRECTIVES.WORKER_SRC] = [
        {
            value: "'self'",
            msg: "the worker script will not be allowed to load from the same origin",
            criticality: "high"
        },
        {
            value: "blob:",
            msg: "the worker script will not be allowed to load from blob URLs",
            criticality: "high"
        },
    ],
    _a["connect-src"] = [
        {
            value: "*.visualwebsiteoptimizer.com",
            msg: "the network calls required for performing data collection will be impacted",
            criticality: "high"
        },
        {
            value: "app.vwo.com",
            msg: "the network calls required for connecting", // not sure about this!
            criticality: "medium"
        },
    ],
    _a["frame-src"] = [
        {
            value: "*.visualwebsiteoptimizer.com",
            msg: "the preview debugger will not be able to load",
            criticality: "medium"
        },
        {
            value: "app.vwo.com",
            msg: "the network calls required for connecting", // not sure about this!
            criticality: "medium"
        },
    ],
    _a["img-src"] = [
        {
            value: constants_1.default.USER_UPLOADS_DOMAIN,
            msg: "the images uploaded by the user will not be loaded",
            criticality: "medium"
        },
        {
            value: "*.visualwebsiteoptimizer.com",
            msg: "the images loaded via VWO will not be loaded",
            criticality: "medium"
        },
        {
            value: "app.vwo.com",
            msg: "the network calls required for connecting", // not sure about this!
            criticality: "medium"
        },
    ],
    _a["style-src"] = [
        {
            value: "'unsafe-inline'",
            msg: "the inline style tags will cease to function leading to issues in preview debugger",
            criticality: "medium"
        },
        {
            value: "*.visualwebsiteoptimizer.com",
            msg: "the styles required for loading the VWO editor will not be loaded",
            criticality: "medium"
        },
        {
            value: constants_1.default.VWO_ENGAGE_CDN,
            msg: "the styles required for loading VWO Engage will cease to function",
            criticality: "medium"
        },
    ],
    _a["child-src"] = [constants_1.default.CSP.DIRECTIVES.WORKER_SRC],
    _a["default-src"] = ["script-src", "img-src"],
    _a);
var findMessageForDirective = function (directiveName, directiveReqValue) {
    var _a;
    var value = { msg: "NA", criticality: "low" };
    if (Array.isArray(messageStore[directiveName])) {
        var messageStoreList = messageStore[directiveName];
        for (var idx = 0; idx < messageStoreList.length; idx++) {
            var msgEntry = messageStoreList[idx];
            if (value.msg !== "NA") {
                break;
            }
            if (typeof msgEntry === "string") {
                value = (0, exports.findMessageForDirective)(msgEntry, directiveReqValue);
            }
            else if (msgEntry.value === directiveReqValue ||
                ((_a = msgEntry === null || msgEntry === void 0 ? void 0 : msgEntry.regex) === null || _a === void 0 ? void 0 : _a.test(directiveReqValue))) {
                return { msg: msgEntry.msg, criticality: msgEntry.criticality || "low" };
            }
        }
    }
    return value;
};
exports.findMessageForDirective = findMessageForDirective;
