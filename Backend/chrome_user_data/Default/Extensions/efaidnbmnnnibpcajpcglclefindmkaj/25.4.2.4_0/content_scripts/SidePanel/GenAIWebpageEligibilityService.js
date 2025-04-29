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
class GenAIWebpageEligibilityService{static isReadable=null;static isEdgeBrowser(){return navigator.userAgentData?navigator.userAgentData.brands.some((e=>"Microsoft Edge"===e.brand)):navigator.userAgent.includes("Edg/")}static async isPopupOrApp(){const e=await chrome.runtime.sendMessage({type:"getWindowType"}),{isPopup:t,isApp:i}=e;return t||i}static reset(){this.isReadable=null}static async shouldShowTouchpoints(){if(this.isEdgeBrowser())return!1;const e=chrome.runtime.getURL(""),t=window.location.href,i=new URL(t).hostname;if(t.startsWith(e)||GENAI_WEBPAGE_BLOCKLIST.find((e=>t.includes(e))))return!1;if(document.contentType&&document.contentType.includes("application/pdf"))return!1;if(await this.isPopupOrApp())return!1;await initDcLocalStorage();if(!window.dcLocalStorage.getItem("sidePanelRegistered"))return!1;if([...window.dcLocalStorage.getItem("hideFabDomainList")||[],...window.dcLocalStorage.getItem("genaiWebpageBlockList")||[]].includes(i))return!1;return await this.isCurrentWebPageReadable()}static async isCurrentWebPageReadable(){await initDcLocalStorage();if("true"===window.dcLocalStorage.getItem("bypassReadabilityEligibility"))return!0;if(null!==this.isReadable)return this.isReadable;const e=chrome.runtime.getURL("resources/SidePanel/sidePanelUtil.js"),{isProbablyFirefoxReaderable:t}=await import(e);return this.isReadable=t(document,document.URL),this.isReadable}static async shouldDisableTouchpoints(){return!1}}