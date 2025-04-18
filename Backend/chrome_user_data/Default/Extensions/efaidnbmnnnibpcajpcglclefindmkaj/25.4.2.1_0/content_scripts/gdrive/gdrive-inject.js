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
!function(){const t=XMLHttpRequest.prototype,e=t.send;t.send=function(){return this.addEventListener("load",(function(){const t=new URL(this.responseURL);if(t&&"clients6.google.com"===t?.hostname&&t?.pathname?.includes("/drive/v2internal/apps")){const t=this.response;document.dispatchEvent(new CustomEvent("acrobat-addon-status-data",{detail:{responseData:t,url:this.responseURL}}))}})),e.apply(this,arguments)}}();