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
import{sendErrorLog,getParsedJSON,extractFileIdFromDriveUrl,sendAnalytics,sendAnalyticsOncePerMonth}from"../gsuite/util.js";import state from"./state.js";const PDF_MIME_TYPE="application/pdf",GSUITE_ADDON_ID="80763634447",processSearchApiResponse=e=>{try{const s=e?.detail?.searchResponse;if(!s)return;const t=s.split("\n"),r=t[t.length-1],n=getParsedJSON(r);if(!Array.isArray(n)||n.length<5||!Array.isArray(n[4]))return;const a=e=>Array.isArray(e)&&e.length>12,i=n[4].every(a)?n[4].map(getFileDetailsFromApiResponse):[];state.searchFileList=i.filter((e=>e.mimeType===PDF_MIME_TYPE))}catch(e){sendErrorLog("Error in GSuite","Failure in parsing GDrive search API response")}},getFileDetailsFromApiResponse=e=>({id:extractFileIdFromDriveUrl(e[5]),mimeType:e[11],title:e[12]}),handleGDriveInstalledAppResponse=e=>{try{const s=JSON.parse(e?.detail?.responseData);if(!s)return void sendAnalytics("DCBrowserExt:Gdrive:AddOn:ResponseMissing");if(state.addOnStatus={},!(Array.isArray(s?.items)&&s.items.length>0))return void sendAnalytics("DCBrowserExt:Gdrive:AddOn:ResponseParsingFailed");if(state.addOnStatus.isAddOnInstalled=s.items.some((e=>"80763634447"===e.id)),!state?.addOnStatus?.isAddOnInstalled)return void(state.addOnStatus.isAddOnDefault=!1);sendAnalyticsOncePerMonth("DCBrowserExt:Gdrive:AddOn:Installed"),Array.isArray(s?.defaultAppIds)&&s.defaultAppIds.length>0?(state.addOnStatus.isAddOnDefault=s?.defaultAppIds?.includes("80763634447"),state?.addOnStatus?.isAddOnDefault&&sendAnalyticsOncePerMonth("DCBrowserExt:Gdrive:AddOn:Default")):sendAnalytics("DCBrowserExt:Gdrive:AddOn:DefaultStatusParsingFailed")}catch(e){sendAnalytics("DCBrowserExt:Gdrive:AddOn:ResponseParsingFailed")}};export{processSearchApiResponse,handleGDriveInstalledAppResponse};