/* CUPPA UI localization. Text nodes and display attributes only; no HTML replacement. */
(function(g){
'use strict';
if(g.CuppaI18n)return;
var entries=g.CUPPA_TRANSLATIONS||{}, originals=new WeakMap(), attrs=new WeakMap(), lang='ar', observer, queued=false;
var skip='script,style,code,pre,textarea,[contenteditable="true"],[data-i18n-skip],[data-no-translate],.no-translate';
var valid=function(l){return ['ar','en','bn'].includes(l)};
var normalize=function(s){return s.replace(/\s+/g,' ').trim()};
var reverse={}; Object.keys(entries).forEach(function(ar){reverse[normalize(ar)]=ar;['en','bn'].forEach(function(l){var v=entries[ar][l];if(v&&!reverse[normalize(v)])reverse[normalize(v)]=ar})});
function translate(s,target){
 if(typeof s!=='string'||!s.trim())return s;
 target=target||lang;var n=normalize(s),key=reverse[n],value;
 if(key){value=target==='ar'?key:entries[key][target];return value?s.replace(s.trim(),value):s}
 if(target==='ar')return s;
 /* Phrase boundaries prevent translating substrings inside unrelated words. */
 return s.replace(/ر\.س\.?/g,target==='en'?'SAR':'রিয়াল').replace(/[\u0600-\u06ff]+(?:[ \t]+[\u0600-\u06ff]+)*/g,function(part){
  var row=entries[normalize(part)];return row&&row[target]?row[target]:part;
 });
}
function excluded(el){return !el||!!el.closest(skip)}
function textNode(n){
 if(excluded(n.parentElement))return;
 var old=originals.get(n);if(!old||n.nodeValue!==old.output)old={source:n.nodeValue,output:n.nodeValue};
 var out=translate(old.source);if(n.nodeValue!==out)n.nodeValue=out;old.output=out;originals.set(n,old);
}
function element(el){
 if(excluded(el))return;
 var saved=attrs.get(el)||{};
 ['placeholder','title','aria-label','alt'].forEach(function(a){
  if(!el.hasAttribute(a))return;
  var now=el.getAttribute(a),v=saved[a];if(!v||now!==v.output)v={source:now};
  v.output=translate(v.source);if(now!==v.output)el.setAttribute(a,v.output);saved[a]=v;
 });
 /* Never translate input values: these may be submitted to the server. */
 attrs.set(el,saved);
}
function scan(root){
 if(!root)return;
 if(root.nodeType===3){textNode(root);return}
 if(root.nodeType===1)element(root);
 var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[],n;while(n=w.nextNode())nodes.push(n);nodes.forEach(textNode);
 if(root.querySelectorAll)root.querySelectorAll('[placeholder],[title],[aria-label],[alt]').forEach(element);
}
function observe(){if(!document.body)return;observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','alt','aria-label']})}
function refresh(){queued=false;observer.disconnect();scan(document.documentElement);observe()}
function schedule(){if(!queued){queued=true;queueMicrotask(refresh)}}
function setLanguage(next,persist){
 if(!valid(next))return;
 lang=next;document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
 if(persist!==false){try{localStorage.setItem('cuppaLanguage',lang)}catch(e){}}
 refresh();
 document.querySelectorAll('[data-language]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.language===lang))});
 document.querySelectorAll('iframe').forEach(function(f){try{if(f.contentWindow.CuppaI18n)f.contentWindow.CuppaI18n.setLanguage(lang,false)}catch(e){}});
}
observer=new MutationObserver(schedule);
g.CuppaI18n={setLanguage:setLanguage,t:translate,refresh:refresh,get language(){return lang},missing:function(root){
 var found=new Set(),w=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT),n;
 while(n=w.nextNode()){if(!excluded(n.parentElement)&&/[\u0621-\u064a]/.test(n.nodeValue))found.add(n.nodeValue.trim())}return Array.from(found);
}};
g.autoTranslatePage=setLanguage;
g.I18N={init:function(o){setLanguage(o.lang)},t:translate,retranslate:refresh};
['alert','confirm','prompt'].forEach(function(k){var fn=g[k];if(typeof fn==='function')g[k]=function(message){var args=Array.from(arguments);args[0]=translate(message);return fn.apply(g,args)}});
function init(){
 var originalSetLang=g.setLang;
 if(typeof originalSetLang==='function'&&!originalSetLang.cuppaLocalized){
  g.setLang=function(next){originalSetLang.apply(this,arguments);setLanguage(next)};g.setLang.cuppaLocalized=true;
 }

 var next=g.CUPPA_LANGUAGE||document.documentElement.lang||'ar';
 try{next=localStorage.getItem('cuppaLanguage')||next}catch(e){}
 if(!valid(next))next='ar';setLanguage(next,false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(window);
