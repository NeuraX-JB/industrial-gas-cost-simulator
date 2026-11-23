"use strict";
// A deliberately small DOM test double, not a layout or browser emulator.
// It exercises the real controllers' state, events and focus without a browser.
function createDOM(html) {
  let document;
  class Node {
    constructor(tag, text) {
      this.tagName=tag.toUpperCase();this.nodeType=tag==="#text"?3:1;
      this.childNodes=[];this.attrs={};this.listeners={};this.parentNode=null;
      this.style={setProperty(name,value){this[name]=value;}};
      this._text=text||"";this.clientWidth=640;this.offsetWidth=170;this.offsetHeight=70;
      this.classList={toggle:(name,on)=>{const list=new Set(this.className.split(/\s+/).filter(Boolean));if(on===undefined)on=!list.has(name);on?list.add(name):list.delete(name);this.className=[...list].join(" ");return on;}};
    }
    get children(){return this.childNodes.filter(n=>n.nodeType===1);}
    get id(){return this.attrs.id||"";} set id(value){this.attrs.id=String(value);}
    get className(){return this.attrs.class||"";} set className(value){this.attrs.class=String(value);}
    get textContent(){return this.nodeType===3?this._text:this.childNodes.map(n=>n.textContent).join("");}
    set textContent(value){this.replaceChildren();if(String(value)!=="")this.append(new Node("#text",String(value)));}
    get value(){
      if(this.tagName==="SELECT"){
        const options=this.children;
        if(this._value!==undefined)return options.some(n=>n.value===this._value)?this._value:"";
        return (options.find(n=>n.selected)||options[0])?.value||"";
      }
      return this._value??this.attrs.value??"";
    }
    set value(value){this._value=String(value);}
    get valueAsNumber(){return this.value.trim()===""?NaN:Number(this.value);}
    get isConnected(){return document.contains(this);}
    setAttribute(name,value){this.attrs[name]=String(value);if(["hidden","disabled"].includes(name))this[name]=true;}
    getAttribute(name){return Object.hasOwn(this.attrs,name)?this.attrs[name]:null;}
    hasAttribute(name){return Object.hasOwn(this.attrs,name);}
    removeAttribute(name){delete this.attrs[name];if(["hidden","disabled"].includes(name))this[name]=false;}
    append(...nodes){for(let node of nodes){if(typeof node!=="object")node=new Node("#text",String(node));node.remove();node.parentNode=this;this.childNodes.push(node);}}
    appendChild(node){this.append(node);return node;}
    add(node){this.append(node);}
    replaceChildren(...nodes){for(const node of [...this.childNodes])node.remove();if(this.tagName==="SELECT")this._value=undefined;this.append(...nodes);}
    remove(){if(!this.parentNode)return;if(this.contains(document.activeElement))document.activeElement=document.body;const a=this.parentNode.childNodes;a.splice(a.indexOf(this),1);this.parentNode=null;}
    replaceWith(node){const parent=this.parentNode,index=parent.childNodes.indexOf(this);this.remove();node.remove();parent.childNodes.splice(index,0,node);node.parentNode=parent;}
    after(node){const parent=this.parentNode;node.remove();parent.childNodes.splice(parent.childNodes.indexOf(this)+1,0,node);node.parentNode=parent;}
    contains(node){return node===this||this.childNodes.some(child=>child.contains(node));}
    addEventListener(type,listener){(this.listeners[type]||=[]).push(listener);}
    dispatchEvent(event){event.target??=this;event.preventDefault??=()=>{};for(const f of this.listeners[event.type]||[])f(event);this["on"+event.type]?.(event);if(event.bubbles&&this.parentNode)this.parentNode.dispatchEvent(event);return true;}
    focus(){const before=document.activeElement;if(before===this)return;before?.dispatchEvent({type:"blur"});document.activeElement=this;this.dispatchEvent({type:"focus"});}
    click(){return this.onclick?.({target:this,preventDefault(){}});}
    showModal(){this.open=true;}
    close(){this.open=false;}
    getBoundingClientRect(){return {x:0,y:0,left:0,top:0,right:this.clientWidth,bottom:295,width:this.clientWidth,height:295};}
    matches(selector){
      if(selector.startsWith("#"))return this.id===selector.slice(1);
      if(selector.startsWith("."))return this.className.split(/\s+/).includes(selector.slice(1));
      const m=/^(\w+)?(?:\[([\w-]+)(?:="([^"]*)")?\])?$/.exec(selector);
      return !!m&&(!m[1]||this.tagName===m[1].toUpperCase())&&(!m[2]||(m[3]===undefined?this.hasAttribute(m[2]):this.getAttribute(m[2])===m[3]));
    }
    querySelectorAll(selector){return this.childNodes.flatMap(n=>[...(n.nodeType===1&&n.matches(selector)?[n]:[]),...n.querySelectorAll(selector)]);}
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  }
  document=new Node("#document");
  document.createElement=tag=>new Node(tag);
  document.createElementNS=(_,tag)=>new Node(tag);
  document.createTextNode=text=>new Node("#text",text);
  document.getElementById=id=>document.querySelector("#"+id);
  const stack=[document],voids=new Set(["meta","link","input","br","hr","img","use"]);
  for(const token of html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,"").matchAll(/<\/?([\w-]+)\b([^>]*)>|([^<]+)/g)){
    if(token[3]){stack.at(-1).append(token[3]);continue;}
    const [raw,tag,attrs]=token;
    if(raw.startsWith("</")){if(stack.length>1&&stack.at(-1).tagName===tag.toUpperCase())stack.pop();continue;}
    const node=new Node(tag);
    for(const match of attrs.matchAll(/([\w:-]+)(?:="([^"]*)"|='([^']*)'|=([^\s>]+))?/g))node.setAttribute(match[1],match[2]??match[3]??match[4]??"");
    stack.at(-1).append(node);
    if(!voids.has(tag.toLowerCase())&&!raw.endsWith("/>"))stack.push(node);
  }
  document.body=document.querySelector("body")||document;
  document.activeElement=document.body;
  function Option(text,value,defaultSelected,selected){const node=new Node("option");node.textContent=text;node.value=value;node.setAttribute("value",value);node.selected=!!selected;return node;}
  return {document,Option};
}
module.exports={createDOM};
