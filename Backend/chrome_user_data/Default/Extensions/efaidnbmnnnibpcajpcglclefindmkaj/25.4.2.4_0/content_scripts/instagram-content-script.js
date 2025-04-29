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
class InstagramContentScript{constructor(t){this.dcLocalStorage=t}async init(){await chrome.runtime.sendMessage({main_op:"getFloodgateFlag",flag:"dc-cv-instagram-visited-analytics"})&&"true"!==this.dcLocalStorage.getItem("express-instagram-visited-fg-enabled-analytics-logged")&&(this.dcLocalStorage.setItem("express-instagram-visited-fg-enabled-analytics-logged","true"),this.sendAnalyticsEvent([["DCBrowserExt:Express:Instagram:Visited"]]))}sendAnalyticsEvent=t=>{try{chrome.runtime.sendMessage({main_op:"analytics",analytics:t})}catch(t){}}}import(chrome.runtime.getURL("common/local-storage.js")).then((async({dcLocalStorage:t})=>{await t.init();new InstagramContentScript(t).init()}));