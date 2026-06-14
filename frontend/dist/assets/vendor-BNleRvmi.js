var j=Object.defineProperty;var w=(r,e,o)=>e in r?j(r,e,{enumerable:!0,configurable:!0,writable:!0,value:o}):r[e]=o;var V=(r,e,o)=>w(r,typeof e!="symbol"?e+"":e,o);import{r as y}from"./react-core-5TPL3RWa.js";var R={exports:{}},h={};/**
 * @license React
 * use-sync-external-store-with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var c=y;function z(r,e){return r===e&&(r!==0||1/r===1/e)||r!==r&&e!==e}var M=typeof Object.is=="function"?Object.is:z,S=c.useSyncExternalStore,D=c.useRef,O=c.useEffect,W=c.useMemo,p=c.useDebugValue;h.useSyncExternalStoreWithSelector=function(r,e,o,n,s){var a=D(null);if(a.current===null){var t={hasValue:!1,value:null};a.current=t}else t=a.current;a=W(function(){function m(u){if(!d){if(d=!0,i=u,u=n(u),s!==void 0&&t.hasValue){var f=t.value;if(s(f,u))return v=f}return v=u}if(f=v,M(i,u))return f;var b=n(u);return s!==void 0&&s(f,b)?(i=u,f):(i=u,v=b)}var d=!1,i,v,E=o===void 0?null:o;return[function(){return m(e())},E===null?void 0:function(){return m(E())}]},[e,o,n,s]);var l=S(r,a[0],a[1]);return O(function(){t.hasValue=!0,t.value=l},[l]),p(l),l};R.exports=h;var _=R.exports,g=class extends Error{constructor(e){super(e[0].message);V(this,"issues");this.name="SchemaError",this.issues=e}};export{g as S,_ as w};
