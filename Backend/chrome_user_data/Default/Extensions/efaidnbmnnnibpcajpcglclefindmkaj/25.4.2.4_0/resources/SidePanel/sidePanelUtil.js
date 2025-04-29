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
import e from"../../libs/readability.js";const{Readability:t,isProbablyReaderable:n}=e;function r(e){return e.clientHeight>0&&e.clientWidth>0}function o(e,t,o=!0){return!!function(e){if(!["http:","https:","file:"].includes(e.protocol))return!1;const t=e.host;return["amazon.com","github.com","mail.google.com","pinterest.com","reddit.com","twitter.com","youtube.com","app.slack.com"].some((e=>t.endsWith(e)))?!("github.com"!==t||e.pathname.includes("/projects")&&!e.pathname.includes("/issues")):"/"!==e.pathname}(new URL(t))&&n(e,o?r:void 0)}function i(e,n){const r=(new DOMParser).parseFromString(e,"text/html");if(o(r,n,!1)){return new t(r).parse().content}return e}async function a(e){return(await chrome.i18n.detectLanguage(e)).languages.reduce(((e,t)=>e.percentage>t.percentage?e:t),{language:"en",percentage:0})}export{o as isProbablyFirefoxReaderable,i as getReadableContent,a as getContentLocale};