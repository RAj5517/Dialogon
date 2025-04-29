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
import{getParentElementForNativeViewerPrompt}from"../../gmail/util.js";import state from"../../gmail/state.js";import expressDropdownMenu from"../dropdown-menu.js";import{sendAnalytics}from"../../gsuite/util.js";const previewEntryPointId="express-gmail-native-viewer-entry-point",touchpoint="gmailNativeViewer",_getVisibleViewer=()=>{const e=state?.expressConfig?.selectors?.activeViewElementId??"drive-active-item-info",t=document.getElementById(e);return t?t.parentElement:null},_isImagePreviewed=()=>{const e=(state?.expressConfig?.selectors??{}).imgPrev??"aLF-aPX-J1-J3",t=_getVisibleViewer();if(!t)return null;const i=t.getElementsByClassName(e);return i&&i.length>0?i[0].getAttribute("src"):null},_clickCallback=e=>{chrome.runtime.sendMessage({main_op:"launch-express",imgUrl:state.expressState?.imageURL,intent:e,touchpoint:touchpoint})},_addExpressTouchpoint=async()=>{state.expressState.nativeViewerTouchpointVisible=!0;const e=await expressDropdownMenu.renderMenuButton(_clickCallback,touchpoint);e.id=previewEntryPointId;const t=getParentElementForNativeViewerPrompt();t&&t?.childNodes?.length>0&&(t.insertBefore(e,t.childNodes[0]),sendAnalytics([["DCBrowserExt:Express:Gmail:NativeViewerEntryPoint:Shown"]]))},addExpressNativeViewerTouchpoint=()=>{const e=_isImagePreviewed();if(!e)return void removeExpressTouchpoints();const{nativeViewerTouchpointVisible:t,imageURL:i}=state?.expressState;t||_addExpressTouchpoint(),i!==e&&(state.expressState.imageURL=e)},removeExpressTouchpoints=()=>{const e=document.getElementById(previewEntryPointId);e&&(state.expressState.imageURL=null,state.expressState.nativeViewerTouchpointVisible=!1,e.parentElement?.removeChild(e))};export{addExpressNativeViewerTouchpoint,removeExpressTouchpoints};