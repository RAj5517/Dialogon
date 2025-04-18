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
import{getElementListForSelectors}from"./util.js";import{sendAnalytics,sendAnalyticsOnce}from"../gsuite/util.js";import state from"./state.js";const checkForSearchBarDiv=()=>{try{const e=state?.config?.selectors?.GoogleDriveSearchBar?.searchBar;getElementListForSelectors(e).forEach((e=>{addSearchBarEventListener(e)}))}catch(e){sendAnalyticsOnce("DCBrowserExt:GDrive:Search:ProcessingError")}},addSearchBarEventListener=e=>{e&&!e.hasAttribute("search-bar-listener-added")&&(e.setAttribute("search-bar-listener-added","true"),e.addEventListener("click",(()=>{sendAnalytics([["DCBrowserExt:Gdrive:Search:Clicked"]])}),{signal:state?.eventControllerSignal}))},checkForSearchResultsTable=()=>{try{const e=state?.config?.selectors?.GoogleDriveSearchBar?.tableBody?.roleSelector,r=state?.config?.selectors?.GoogleDriveSearchBar?.tableBody?.classSelector.join(",");let t=document.getElementsByClassName(r);t=Array.from(t).filter((r=>r.matches(e))),t.forEach((e=>{addSearchTableBodyEventListener(e)}))}catch(e){sendAnalyticsOnce("DCBrowserExt:GDrive:SearchTableBody:ProcessingError")}},addSearchTableBodyEventListener=e=>{e&&!e.hasAttribute("search-table-body-listener-added")&&(e.setAttribute("search-table-body-listener-added","true"),e.addEventListener("click",(e=>handleSearchTableClick(e)),{signal:state?.eventControllerSignal,capture:!0}))},handleSearchTableClick=e=>{const r=state?.config?.selectors?.GoogleDriveSearchBar?.tableRow?.roleSelector,t=e.target.closest(r);t&&handleClickEventsForPDFSearch(t)},handleClickEventsForPDFSearch=e=>{const r=state?.config?.selectors?.GoogleDriveSearchBar?.tableRow?.iconSelector.join(",");if(!r)return;const t=e?.querySelector(r);t&&sendAnalytics([["DCBrowserExt:Gdrive:Search:PDF:Clicked"]])};export{checkForSearchBarDiv,checkForSearchResultsTable};