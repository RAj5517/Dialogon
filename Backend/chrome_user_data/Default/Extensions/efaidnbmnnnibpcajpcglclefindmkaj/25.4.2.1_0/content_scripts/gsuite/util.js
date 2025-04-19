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
const sendAnalytics=t=>{try{chrome.runtime.sendMessage({main_op:"analytics",analytics:t})}catch(t){}},formatDateForMonthlyAnalyticsEvent=t=>t instanceof Date?`${t.getUTCFullYear()}${(t.getUTCMonth()+1).toString().padStart(2,"0")}`:"",eventsSent=new Set,sendAnalyticsOnce=t=>{eventsSent?.has(t)||(eventsSent.add(t),sendAnalyticsEvent([t]))},analyticsEvents=new Map,sendAnalyticsOncePerMonth=async(t,e)=>{if(t)try{if(!analyticsEvents?.has(t)){const n=new Date,a=formatDateForMonthlyAnalyticsEvent(n);analyticsEvents.set(t,a);const s=await chrome.storage.local.get([t]),c=s?.[t]?.lastSentYearMonth;if(!c||a>c){sendAnalytics(e?[[t,e]]:[t]);const n={lastSentYearMonth:a};chrome.storage.local.set({[t]:n})}}}catch(t){}},getDefaultViewershipStatusEvar=(t,e,n,a=!1)=>{if(a){let a=n+"DV-"+(e?"Treatment":"Control");return a+="-"+(t?"True":"False"),{experimentEnablementStatus:a}}return{}},createAcrobatIconElement=(t,e)=>{const n=document.createElement("img"),a=chrome.runtime.getURL(e);return n.setAttribute("src",a),n.setAttribute("class",t),n},isAnalyticsSentInTheMonthOrSession=t=>analyticsEvents?.has(t);export{createAcrobatIconElement,sendAnalytics,sendAnalyticsOnce,sendAnalyticsOncePerMonth,getDefaultViewershipStatusEvar,isAnalyticsSentInTheMonthOrSession};