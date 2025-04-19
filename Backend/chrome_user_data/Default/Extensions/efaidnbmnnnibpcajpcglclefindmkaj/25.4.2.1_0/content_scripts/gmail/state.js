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
import{sendAnalytics}from"../gsuite/util.js";let abortController=new AbortController,internalState={lruThreadsData:new Map};const state={gmailConfig:{},getMessagesForThreadId(e){let t=internalState.lruThreadsData.get(e);return t?(internalState.lruThreadsData.delete(e),internalState.lruThreadsData.set(e,t),t.messages):null},updateLRUThreadData(e){const t=this.gmailConfig?.selectors?.listView?.maxLRUSizeForThreadData||3e3,a=internalState.lruThreadsData;if(a.has(e.id))a.delete(e.id);else if(a.size===t){const e=a.keys().next().value;a.delete(e),sendAnalytics([["DCBrowserExt:Gmail:ResponseLRU:Full"]])}a.set(e.id,e)},setDataForThread(e){this.updateLRUThreadData(e)},get eventControllerSignal(){return abortController.signal},nativeViewerPromptState:{nativeViewerPromptVisible:!1,previousFileDetailsElement:null,nativeViewerAttachmentURL:null,driveButtonAddedListeners:{}},iconURL:"",iconURLListView:"",viewerURLPrefix:"",disconnectBodyObserver:!1,adobeCleanFontAdded:!1,gmailResponseListenerAdded:!1,disconnectEventListeners(){abortController?.abort(),this.disconnectBodyObserver=!0},resetDOMElementListener(){abortController?.abort(),abortController=new AbortController},createStateToTransferToNewContentScript:()=>({internalState:internalState,gmailResponseListenerAdded:state?.gmailResponseListenerAdded,adobeCleanFontAdded:state?.adobeCleanFontAdded,isAcrobatDefaultForGmailPDFs:state?.isAcrobatDefaultForGmailPDFs}),contentScriptDisconnectStart(){chrome.runtime?.id||(this.disconnectEventListeners(),this.nativeViewerPromptState={})},contentScriptDisconnectEnd(e){if(!chrome.runtime?.id)return;const t=e?.detail?.state;internalState=t?.internalState,this.gmailResponseListenerAdded=t?.gmailResponseListenerAdded,this.adobeCleanFontAdded=t?.adobeCleanFontAdded,this.isAcrobatDefaultForGmailPDFs=t?.isAcrobatDefaultForGmailPDFs},fteToolTip:{},isAcrobatDefaultForGmailPDFs:!1,analyticsForImageInAPIResponse:!1,analyticsForImageClicked:!1};export default state;