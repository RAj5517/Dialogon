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
import{EXPERIMENT_VARIANTS_STORAGE_KEY as t}from"../sw_modules/constant.js";import{dcLocalStorage as e}from"./local-storage.js";function o(){const o=e.getItem(t);return(Array.isArray(o)?o.sort():[]).join("_")}function r(o){let r=e.getItem(t)||[];r.includes(o)||r.push(o),e.setItem(t,r)}function s(o){let r=e.getItem(t)||[];r.includes(o)&&(r=r.filter((t=>t!==o))),e.setItem(t,r)}export{o as getActiveExperimentAnalyticsString,r as setExperimentCodeForAnalytics,s as removeExperimentCodeForAnalytics};