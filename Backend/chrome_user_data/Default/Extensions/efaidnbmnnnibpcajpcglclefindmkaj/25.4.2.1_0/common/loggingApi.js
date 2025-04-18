/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
*  Copyright 2015 Adobe Systems Incorporated
*  All Rights Reserved.
*
* NOTICE:  All information contained herein is, and remains
* the property of Adobe Systems Incorporated and its suppliers,
* if any.  The intellectual and technical concepts contained
* herein are proprietary to Adobe Systems Incorporated and its
* suppliers and are protected by all applicable intellectual property laws,
* including trade secret and or copyright laws.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe Systems Incorporated.
**************************************************************************/
import{EVAR_KEYS as e,EXPERIMENT_VARIANTS_STORAGE_KEY as t,LOGGING_URI as s}from"../sw_modules/constant.js";import{dcLocalStorage as o}from"./local-storage.js";import{SETTINGS as r}from"../sw_modules/settings.js";import{allowedLogs as n}from"../sw_modules/splunkAllowedLogs.js";import{util as i}from"../sw_modules/util.js";const l=new class{constructor(){this.flushInterval=1e4,this.SERVER_PATH="/system/log",this.SERVER_CONTENT_TYPE='application/vnd.adobe.dc+json; profile="/schemas/system_log_parameters_v1.json"',setTimeout((()=>{const e=o.getItem("installSource");this.loggingUri=s[o.getItem("env")],"development"===e&&(this.loggingUri=s.stage,this.enableConsole=!0)}),250)}registerLogInterval(e){e?this.interval||(this.interval=setInterval((()=>{(o.getItem("deferredLogs")||[]).length>0&&this._flushLogs()}),this.flushInterval)):(o.removeItem("deferredLogs"),clearInterval(this.interval))}renameEvars(t){return Object.entries(e).forEach((([e,s])=>{t.hasOwnProperty(e)&&(t[s]=t[e],delete t[e])})),t}_flatten(e){let t={};if(e)for(const[s,o]of Object.entries(e))"object"==typeof o?t={...t,...this._flatten(o)}:t[s]=o;return t}_batchHandler(){return o.getItem("deferredLogs").map((e=>(this.renameEvars(e.message),this._flatten(e))))}_flushLogs(){const e={headers:{"Content-Type":this.SERVER_CONTENT_TYPE.replace("/schemas/",`${this.loggingUri}/schemas/`),"x-request-id":i.uuid(),"x-api-app-info":"dc-acrobat-extension","x-api-client-id":`dc-acrobat-extension:${chrome.runtime.id}`}},t=this._batchHandler();this.enableConsole?console.log(t):fetch(this.loggingUri+this.SERVER_PATH,{method:"POST",headers:e.headers,body:JSON.stringify(t)}).catch((e=>console.log(e))),o.setItem("deferredLogs",[])}_logWithoutAuth(e){const t=o.getItem("deferredLogs")||[];t.push(e),o.setItem("deferredLogs",t)}isAllowed(e){const t=o.getItem("allowedLogIndex");return n[e.message]<=t}doLog(e,...s){const r=o.getItem("splunkLoggingEnable");if(!s.length||!s[0]||!1===r||!this.isAllowed(s[0]))return;const n=s[0];n.context||(n.context="logger");const i=o.getItem(t)||[],l={message:n,level:e,sessionId:o.getItem("sessionId")};Array.isArray(i)&&i.length>0&&(l.variants=i.join(":")),this._logWithoutAuth(l)}debug(...e){this.doLog("debug",...e)}info(...e){this.doLog("info",...e)}warn(...e){this.doLog("warn",...e)}error(...e){this.doLog("error",...e)}};export{l as loggingApi};