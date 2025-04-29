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
if(window.self!==window.top){const e=(e,t)=>{try{chrome.runtime.sendMessage({main_op:"analytics",analytics:[[e,t]]})}catch(e){}};if(document?.contentType?.includes("application/pdf")){const t=new URL(window.location.href),o=t?.hash?.includes("toolbar=0"),n=t.hostname;let d="Unknown";document.body?.childNodes?.length>0&&document.body.childNodes[0]?.getAttribute("src")?.startsWith("chrome-extension://dahenjhkoodjbpjheillcadbppiidmhp")?d="GoogleScholar":document.body?.childNodes?.length>0&&"about:blank"===document.body.childNodes[0]?.getAttribute("src")&&(d="NativeViewer"),e("DCBrowserExt:Viewer:Detected:EmbededPDF:IframeContentType",{domain:n,eventContext:`${d}-${!o}`})}}