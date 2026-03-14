"use strict";var oe=Object.defineProperty;var Be=Object.getOwnPropertyDescriptor;var Ve=Object.getOwnPropertyNames;var Ue=Object.prototype.hasOwnProperty;var _e=(l,a)=>{for(var e in a)oe(l,e,{get:a[e],enumerable:!0})},$e=(l,a,e,t)=>{if(a&&typeof a=="object"||typeof a=="function")for(let n of Ve(a))!Ue.call(l,n)&&n!==e&&oe(l,n,{get:()=>a[n],enumerable:!(t=Be(a,n))||t.enumerable});return l};var He=l=>$e(oe({},"__esModule",{value:!0}),l);var lt={};_e(lt,{default:()=>re});module.exports=He(lt);var y=require("obsidian");var f=require("obsidian");function F(l){if(!Number.isFinite(l)||l<=0)return"0 B";let a=1024,e=["B","KB","MB","GB"],t=Math.max(0,Math.min(Math.floor(Math.log(l)/Math.log(a)),e.length-1));return parseFloat((l/Math.pow(a,t)).toFixed(2))+" "+e[t]}function ue(l,a){let e=null;return(...t)=>{e&&clearTimeout(e),e=setTimeout(()=>{l(...t)},a)}}function p(l){if(typeof l!="string")return"";let a=l.trim().replace(/\\/g,"/");for(a=a.replace(/\/{2,}/g,"/"),a=a.replace(/^\/+/,"");a.startsWith("./");)a=a.slice(2);return a=a.replace(/\/+$/,""),a}function $(l){let a=p(l);if(!a)return"";let e=a.split("/");return e[e.length-1]||""}function me(l){let a=p(l);if(!a)return"";let e=a.lastIndexOf("/");return e===-1?"":a.slice(0,e)}function O(l){try{return decodeURIComponent(l)}catch{return l}}var je=[".png",".jpg",".jpeg",".gif",".webp",".svg",".bmp"],Ge=[".mp4",".mov",".avi",".mkv",".webm"],We=[".mp3",".wav",".ogg",".m4a",".flac"],qe=[".pdf"],pe=[...je],fe=[...Ge],be=[...We],ye=[...qe],Ke=[...pe,...fe,...be,...ye],Qe={".png":"image",".jpg":"image",".jpeg":"image",".gif":"image",".webp":"image",".svg":"image",".bmp":"image",".mp4":"video",".mov":"video",".avi":"video",".mkv":"video",".webm":"video",".mp3":"audio",".wav":"audio",".ogg":"audio",".m4a":"audio",".flac":"audio",".pdf":"document"};function N(l){let a=l.lastIndexOf(".");return a===-1?"":l.substring(a).toLowerCase()}function M(l){let a=N(l);return Qe[a]||null}function G(l){let a=N(l);return Ke.includes(a)}function Z(l){let a=[];return l.enableImages!==!1&&a.push(...pe),l.enableVideos!==!1&&a.push(...fe),l.enableAudio!==!1&&a.push(...be),l.enablePDF!==!1&&a.push(...ye),a}var Ye="obsidian-media-toolkit-thumbs";var C="thumbnails",J=class{constructor(a=5e3){this.db=null;this.memoryCache=new Map;this.maxEntries=a}async open(){if(!this.db)return new Promise((a,e)=>{let t=indexedDB.open(Ye,1);t.onupgradeneeded=n=>{let i=n.target.result;i.objectStoreNames.contains(C)||i.createObjectStore(C,{keyPath:"path"}).createIndex("createdAt","createdAt",{unique:!1})},t.onsuccess=n=>{this.db=n.target.result,a()},t.onerror=()=>{console.warn("ThumbnailCache: Failed to open IndexedDB, running without cache"),a()}})}close(){for(let a of this.memoryCache.values())URL.revokeObjectURL(a.url);this.memoryCache.clear(),this.db&&(this.db.close(),this.db=null)}async get(a,e){let t=this.memoryCache.get(a);return t&&t.mtime===e?t.url:this.db?new Promise(n=>{let r=this.db.transaction(C,"readonly").objectStore(C).get(a);r.onsuccess=()=>{let o=r.result;if(o&&o.mtime===e){let c=URL.createObjectURL(o.blob);this.memoryCache.set(a,{mtime:e,url:c}),n(c)}else n(null)},r.onerror=()=>n(null)}):null}async put(a,e,t,n,i){let s=this.memoryCache.get(a);s&&URL.revokeObjectURL(s.url);let r=URL.createObjectURL(t);if(this.memoryCache.set(a,{mtime:e,url:r}),!!this.db)return new Promise(o=>{let c=this.db.transaction(C,"readwrite"),d=c.objectStore(C),g={path:a,mtime:e,blob:t,width:n,height:i,createdAt:Date.now()};d.put(g),c.oncomplete=()=>{this.evictIfNeeded(),o()},c.onerror=()=>o()})}async delete(a){let e=this.memoryCache.get(a);if(e&&(URL.revokeObjectURL(e.url),this.memoryCache.delete(a)),!!this.db)return new Promise(t=>{let n=this.db.transaction(C,"readwrite");n.objectStore(C).delete(a),n.oncomplete=()=>t(),n.onerror=()=>t()})}async clear(){for(let a of this.memoryCache.values())URL.revokeObjectURL(a.url);if(this.memoryCache.clear(),!!this.db)return new Promise(a=>{let e=this.db.transaction(C,"readwrite");e.objectStore(C).clear(),e.oncomplete=()=>a(),e.onerror=()=>a()})}async rename(a,e){let t=this.memoryCache.get(a);if(t&&(this.memoryCache.delete(a),this.memoryCache.set(e,t)),!!this.db)return new Promise(n=>{let i=this.db.transaction(C,"readwrite"),s=i.objectStore(C),r=s.get(a);r.onsuccess=()=>{let o=r.result;o&&(s.delete(a),o.path=e,s.put(o))},i.oncomplete=()=>n(),i.onerror=()=>n()})}async evictIfNeeded(){if(!this.db)return;let t=this.db.transaction(C,"readonly").objectStore(C).count();t.onsuccess=()=>{let n=t.result;if(n<=this.maxEntries)return;let i=n-this.maxEntries,c=this.db.transaction(C,"readwrite").objectStore(C).index("createdAt").openCursor(),d=0;c.onsuccess=g=>{let h=g.target.result;if(h&&d<i){let u=h.value.path,T=this.memoryCache.get(u);T&&(URL.revokeObjectURL(T.url),this.memoryCache.delete(u)),h.delete(),d++,h.continue()}}}}};function xe(l,a=200){return new Promise((e,t)=>{let n=new Image;n.crossOrigin="anonymous",n.onload=()=>{try{let{width:i,height:s}=n,r=i,o=s;if(i>a||s>a){let g=Math.min(a/i,a/s);r=Math.round(i*g),o=Math.round(s*g)}let c=document.createElement("canvas");c.width=r,c.height=o;let d=c.getContext("2d");if(!d){t(new Error("Cannot get canvas context"));return}d.drawImage(n,0,0,r,o),c.toBlob(g=>{g?e({blob:g,width:r,height:o}):t(new Error("Canvas toBlob returned null"))},"image/webp",.7)}catch(i){t(i)}},n.onerror=()=>t(new Error(`Failed to load image: ${l}`)),n.src=l})}function ve(l){let a=new DataView(l),e={};if(a.getUint16(0)!==65496)return e;let t=2,n=Math.min(l.byteLength,65536);for(;t<n&&a.getUint8(t)===255;){let i=a.getUint8(t+1);if(t+=2,i===225){if(a.getUint16(t)>8&&a.getUint32(t+2)===1165519206&&a.getUint16(t+6)===0){let r=t+8;Xe(a,r,e)}return e}if(i>=224&&i<=239||i===254){let s=a.getUint16(t);t+=s}else{if(i===218)break;if(t+2<=n){let s=a.getUint16(t);t+=s}else break}}return e}function Xe(l,a,e){if(a+8>l.byteLength)return;let t=l.getUint16(a),n=t===18761;if(t!==18761&&t!==19789||l.getUint16(a+2,n)!==42)return;let i=l.getUint32(a+4,n);Ie(l,a,a+i,n,e,!0)}function Ie(l,a,e,t,n,i){if(e+2>l.byteLength)return;let s=l.getUint16(e,t),r=e+2;for(let o=0;o<s&&!(r+12>l.byteLength);o++){let c=l.getUint16(r,t),d=l.getUint16(r+2,t),g=l.getUint32(r+4,t),h=r+8;switch(c){case 271:n.make=le(l,a,h,d,g,t);break;case 272:n.model=le(l,a,h,d,g,t);break;case 274:n.orientation=Se(l,h,t);break;case 36867:n.dateTimeOriginal=le(l,a,h,d,g,t);break;case 40962:n.imageWidth=we(l,h,d,t);break;case 40963:n.imageHeight=we(l,h,d,t);break;case 34665:if(i){let u=l.getUint32(h,t);Ie(l,a,a+u,t,n,!1)}break}r+=12}}function Se(l,a,e){return a+2>l.byteLength?0:l.getUint16(a,e)}function we(l,a,e,t){return e===3?Se(l,a,t):a+4>l.byteLength?0:l.getUint32(a,t)}function le(l,a,e,t,n,i){if(t!==2)return"";let s;if(n<=4)s=e;else{if(e+4>l.byteLength)return"";s=a+l.getUint32(e,i)}if(s+n>l.byteLength)return"";let r="";for(let o=0;o<n-1;o++){let c=l.getUint8(s+o);if(c===0)break;r+=String.fromCharCode(c)}return r.trim()}function Te(l){let a=l.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);if(!a)return null;let[,e,t,n,i,s,r]=a;return new Date(parseInt(e),parseInt(t)-1,parseInt(n),parseInt(i),parseInt(s),parseInt(r))}function ce(l,a,e){let t=N(a.name).replace(".","").toLowerCase();for(let n of l)if(n.enabled&&!(n.matchExtensions&&!n.matchExtensions.split(",").map(s=>s.trim().toLowerCase()).includes(t)))return n;return null}function de(l,a){let e=N(a.file.name),t=a.file.name.replace(/\.[^.]+$/,""),n=M(a.file.name)||"other",i=a.date;if(a.exif?.dateTimeOriginal){let S=Te(a.exif.dateTimeOriginal);S&&(i=S)}let s=String(i.getFullYear()),r=String(i.getMonth()+1).padStart(2,"0"),o=String(i.getDate()).padStart(2,"0"),c=a.exif?.make?`${a.exif.make}${a.exif.model?" "+a.exif.model:""}`:"Unknown",d=a.tags?.[0]||"untagged",g={"{year}":s,"{month}":r,"{day}":o,"{ext}":e.replace(".",""),"{name}":t,"{camera}":De(c),"{type}":n,"{tag}":De(d)},h=l.pathTemplate;for(let[S,E]of Object.entries(g))h=h.replace(new RegExp(Ee(S),"g"),E);let u=l.renameTemplate||"{name}";for(let[S,E]of Object.entries(g))u=u.replace(new RegExp(Ee(S),"g"),E);u.endsWith(e)||(u=u+e),h=h.replace(/\/+/g,"/").replace(/^\/|\/$/g,"");let T=h?`${h}/${u}`:u;return{originalPath:a.file.path,newPath:T,newName:u}}function De(l){return l.replace(/[/\\:*?"<>|]/g,"_").replace(/\s+/g,"_").replace(/_+/g,"_").trim()}function Ee(l){return l.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}var Ze={webp:"image/webp",jpeg:"image/jpeg",jpg:"image/jpeg",png:"image/png",avif:"image/avif"};function Je(l){return new Promise((a,e)=>{let t=new Image;t.crossOrigin="anonymous",t.onload=()=>a(t),t.onerror=()=>e(new Error(`Failed to load image: ${l}`)),t.src=l})}async function Fe(l,a,e={}){let t=await Je(l),{width:n,height:i}=t,s=0,r=0,o=n,c=i;e.crop&&(s=-e.crop.x,r=-e.crop.y,n=e.crop.width,i=e.crop.height);let d=n,g=i;if(e.maxWidth||e.maxHeight){let x=e.maxWidth||1/0,P=e.maxHeight||1/0,v=Math.min(x/n,P/i,1);d=Math.round(n*v),g=Math.round(i*v)}let h=document.createElement("canvas");h.width=d,h.height=g;let u=h.getContext("2d");if(!u)throw new Error("Cannot get canvas context");if(e.crop){let x=d/n,P=g/i;u.drawImage(t,e.crop.x,e.crop.y,e.crop.width,e.crop.height,0,0,d,g)}else u.drawImage(t,0,0,d,g);if(e.watermark?.text){let x=e.watermark,P=x.fontSize||Math.max(16,Math.round(d/30));u.save(),u.globalAlpha=x.opacity,u.font=`${P}px sans-serif`,u.fillStyle="#ffffff",u.strokeStyle="#000000",u.lineWidth=2;let v=u.measureText(x.text),L,A;switch(x.position){case"center":L=(d-v.width)/2,A=g/2+P/2;break;case"bottom-left":L=20,A=g-20;break;default:L=d-v.width-20,A=g-20;break}u.strokeText(x.text,L,A),u.fillText(x.text,L,A),u.restore()}let T=e.format||"webp",S=(e.quality??80)/100,E=Ze[T]||"image/webp",k=await new Promise((x,P)=>{h.toBlob(v=>{v?x(v):P(new Error("Canvas toBlob returned null"))},E,S)});return{blob:k,width:d,height:g,originalSize:a,newSize:k.size,format:T}}function Ce(l){switch(l){case"jpeg":return".jpg";case"webp":return".webp";case"png":return".png";case"avif":return".avif";default:return`.${l}`}}var B="image-library-view",W=class extends f.ItemView{constructor(e,t){super(e);this.images=[];this.filteredImages=[];this.searchQuery="";this.currentPage=1;this.pageSize=50;this.selectedFiles=new Set;this.isSelectionMode=!1;this.searchInput=null;this.plugin=t}isProcessableImage(e){let t=N(e.name);return[".png",".jpg",".jpeg",".webp",".bmp"].includes(t)}getViewType(){return B}getDisplayText(){return this.plugin.t("mediaLibrary")}async onOpen(){let e=0;for(;!this.contentEl&&e<10;)await new Promise(t=>setTimeout(t,50)),e++;if(!this.contentEl){console.error("ImageLibraryView: contentEl not ready after retries");return}this.contentEl.addClass("image-library-view"),this.pageSize=this.plugin.settings.pageSize||50,await this.refreshImages()}async onClose(){}async refreshImages(){if(!this.contentEl)return;this.pageSize=Math.max(1,this.plugin.settings.pageSize||50);let t={small:"small",medium:"medium",large:"large"}[this.plugin.settings.thumbnailSize]||"medium";this.contentEl.empty();let n;this.plugin.fileIndex.isInitialized?n=this.plugin.fileIndex.getFiles().map(h=>this.app.vault.getAbstractFileByPath(h.path)).filter(h=>h instanceof f.TFile):n=await this.plugin.getAllImageFiles();let i;if(this.plugin.settings.imageFolder){let g=p(this.plugin.settings.imageFolder),h=g?`${g}/`:"";i=n.filter(u=>{let T=p(u.path);return T===g||(h?T.startsWith(h):!1)})}else i=n;this.images=i.map(g=>({file:g,path:g.path,name:g.name,size:g.stat.size,modified:g.stat.mtime})),this.sortImages(),this.applySearch();let s=Math.max(1,Math.ceil(this.filteredImages.length/this.pageSize));this.currentPage>s&&(this.currentPage=s),this.renderHeader(),this.renderSearchBox(),this.isSelectionMode&&this.renderSelectionToolbar();let r=this.contentEl.createDiv({cls:"image-grid"});r.addClass(`image-grid-${t}`);let o=(this.currentPage-1)*this.pageSize,c=Math.min(o+this.pageSize,this.filteredImages.length),d=this.filteredImages.slice(o,c);for(let g of d)this.renderImageItem(r,g);this.renderPagination(),this.filteredImages.length===0&&this.contentEl.createDiv({cls:"empty-state",text:this.searchQuery?this.plugin.t("noMatchingFiles"):this.plugin.t("noMediaFiles")})}applySearch(){if(!this.searchQuery)this.filteredImages=[...this.images];else{let e=this.searchQuery.toLowerCase();this.filteredImages=this.images.filter(t=>t.name.toLowerCase().includes(e)||t.path.toLowerCase().includes(e))}}renderSearchBox(){let e=this.contentEl.createDiv({cls:"search-container"});this.searchInput=e.createEl("input",{type:"text",cls:"search-input",attr:{placeholder:this.plugin.t("searchPlaceholder"),value:this.searchQuery}});let t=e.createDiv({cls:"search-icon"});if((0,f.setIcon)(t,"search"),this.searchQuery){let i=e.createEl("button",{cls:"clear-search"});(0,f.setIcon)(i,"x"),i.addEventListener("click",()=>{this.searchQuery="",this.currentPage=1,this.applySearch(),this.refreshImages()})}let n=ue(()=>{this.currentPage=1,this.applySearch(),this.refreshImages()},300);this.searchInput.addEventListener("input",i=>{let s=i.target;this.searchQuery=s.value,n()}),this.searchQuery&&e.createSpan({text:this.plugin.t("searchResults").replace("{count}",String(this.filteredImages.length)),cls:"search-results-count"})}renderSelectionToolbar(){let e=this.contentEl.createDiv({cls:"selection-toolbar"});e.createSpan({text:this.plugin.t("selectFiles").replace("{count}",String(this.selectedFiles.size)),cls:"selection-count"});let t=e.createEl("button",{cls:"toolbar-button"});(0,f.setIcon)(t,"check-square"),t.addEventListener("click",()=>{this.filteredImages.forEach(c=>this.selectedFiles.add(c.file.path)),this.refreshImages()});let n=e.createEl("button",{cls:"toolbar-button"});(0,f.setIcon)(n,"square"),n.addEventListener("click",()=>{this.selectedFiles.clear(),this.refreshImages()});let i=e.createEl("button",{cls:"toolbar-button danger"});(0,f.setIcon)(i,"trash-2"),i.addEventListener("click",()=>this.deleteSelected());let s=e.createEl("button",{cls:"toolbar-button"});(0,f.setIcon)(s,"folder-input"),s.title=this.plugin.t("organizing"),s.addEventListener("click",()=>this.organizeSelected());let r=e.createEl("button",{cls:"toolbar-button"});(0,f.setIcon)(r,"image-down"),r.title=this.plugin.t("processing"),r.addEventListener("click",()=>this.processSelected());let o=e.createEl("button",{cls:"toolbar-button"});(0,f.setIcon)(o,"x"),o.addEventListener("click",()=>{this.isSelectionMode=!1,this.selectedFiles.clear(),this.refreshImages()})}renderPagination(){let e=Math.ceil(this.filteredImages.length/this.pageSize);if(e<=1)return;let t=this.contentEl.createDiv({cls:"pagination"}),n=t.createEl("button",{cls:"page-button"});n.textContent=this.plugin.t("prevPage"),n.disabled=this.currentPage<=1,n.addEventListener("click",()=>{this.currentPage>1&&(this.currentPage--,this.refreshImages())}),t.createSpan({text:this.plugin.t("pageInfo").replace("{current}",String(this.currentPage)).replace("{total}",String(e)),cls:"page-info"});let i=t.createEl("button",{cls:"page-button"});i.textContent=this.plugin.t("nextPage"),i.disabled=this.currentPage>=e,i.addEventListener("click",()=>{this.currentPage<e&&(this.currentPage++,this.refreshImages())}),t.createEl("input",{type:"number",cls:"page-jump-input",attr:{min:"1",max:String(e),value:String(this.currentPage)}}).addEventListener("change",r=>{let o=r.target,c=parseInt(o.value,10);isNaN(c)&&(c=this.currentPage),c=Math.max(1,Math.min(c,e)),this.currentPage=c,this.refreshImages()})}async deleteSelected(){if(this.selectedFiles.size===0){new f.Notice(this.plugin.t("confirmDeleteSelected").replace("{count}","0"));return}if(confirm(this.plugin.t("confirmDeleteSelected").replace("{count}",String(this.selectedFiles.size)))){let t=this.filteredImages.filter(r=>this.selectedFiles.has(r.file.path)),n=await Promise.all(t.map(r=>this.plugin.safeDeleteFile(r.file))),i=n.filter(r=>r).length,s=n.filter(r=>!r).length;i>0&&new f.Notice(this.plugin.t("deletedFiles").replace("{count}",String(i))),s>0&&new f.Notice(this.plugin.t("deleteFilesFailed").replace("{count}",String(s)),3e3),this.selectedFiles.clear(),this.isSelectionMode=!1,await this.refreshImages()}}renderHeader(){let e=this.contentEl.createDiv({cls:"image-library-header"});e.createEl("h2",{text:this.plugin.t("mediaLibrary")}),e.createDiv({cls:"image-stats"}).createSpan({text:this.plugin.t("totalMediaFiles").replace("{count}",String(this.filteredImages.length))});let n=e.createEl("button",{cls:"refresh-button"});(0,f.setIcon)(n,"refresh-cw"),n.addEventListener("click",()=>this.refreshImages());let i=e.createEl("button",{cls:"refresh-button"});(0,f.setIcon)(i,"check-square"),i.addEventListener("click",()=>{this.isSelectionMode=!this.isSelectionMode,this.isSelectionMode||this.selectedFiles.clear(),this.refreshImages()}),i.title=this.plugin.t("multiSelectMode");let s=e.createEl("select",{cls:"sort-select"});[{value:"name",text:this.plugin.t("sortByName")},{value:"date",text:this.plugin.t("sortByDate")},{value:"size",text:this.plugin.t("sortBySize")}].forEach(c=>{let d=s.createEl("option",{value:c.value,text:c.text});this.plugin.settings.sortBy===c.value&&d.setAttribute("selected","selected")}),s.addEventListener("change",async c=>{let d=c.target;this.plugin.settings.sortBy=d.value,await this.plugin.saveSettings(),this.sortImages(),this.currentPage=1,this.refreshImages()});let o=e.createEl("button",{cls:"order-button"});o.addEventListener("click",async()=>{this.plugin.settings.sortOrder=this.plugin.settings.sortOrder==="asc"?"desc":"asc",await this.plugin.saveSettings(),this.sortImages(),this.currentPage=1,this.refreshImages()}),(0,f.setIcon)(o,this.plugin.settings.sortOrder==="asc"?"arrow-up":"arrow-down")}sortImages(){let{sortBy:e,sortOrder:t}=this.plugin.settings,n=t==="asc"?1:-1;this.images.sort((i,s)=>{switch(e){case"name":return n*i.name.localeCompare(s.name);case"date":return n*(i.modified-s.modified);case"size":return n*(i.size-s.size);default:return 0}})}renderThumbnailFallback(e,t,n){e.empty();let i=e.createDiv();i.style.width="100%",i.style.height="100%",i.style.display="flex",i.style.flexDirection="column",i.style.alignItems="center",i.style.justifyContent="center",i.style.gap="6px",i.style.color="var(--text-muted)";let s=i.createDiv();(0,f.setIcon)(s,t);let r=i.createDiv({text:n});r.style.fontSize="0.75em",r.style.textTransform="uppercase"}renderMediaThumbnail(e,t,n){let i=M(t.name),s=this.app.vault.getResourcePath(t);if(i==="image"){this.renderCachedThumbnail(e,t,s,n);return}if(i==="video"){let r=e.createEl("video");r.src=s,r.muted=!0,r.preload="metadata",r.playsInline=!0,r.style.width="100%",r.style.height="100%",r.style.objectFit="cover",r.addEventListener("error",()=>{this.renderThumbnailFallback(e,"video","VIDEO")});return}if(i==="audio"){this.renderThumbnailFallback(e,"music","AUDIO");return}if(i==="document"){this.renderThumbnailFallback(e,"file-text","PDF");return}this.renderThumbnailFallback(e,"file","FILE")}renderCachedThumbnail(e,t,n,i){let s=this.plugin.thumbnailCache,r=t.stat.mtime,o=e.createEl("img",{attr:{alt:i}});if(o.style.opacity="0",o.style.transition="opacity 0.2s",o.addEventListener("error",()=>{e.empty(),e.createDiv({cls:"image-error",text:this.plugin.t("imageLoadError")})}),t.extension.toLowerCase()==="svg"){o.src=n,o.style.opacity="1";return}s.get(t.path,r).then(c=>{c?(o.src=c,o.style.opacity="1"):(o.src=n,o.style.opacity="1",xe(n,300).then(({blob:d,width:g,height:h})=>s.put(t.path,r,d,g,h)).catch(()=>{}))})}renderImageItem(e,t){let n=e.createDiv({cls:"image-item"});if(this.isSelectionMode){let r=n.createEl("input",{type:"checkbox",cls:"item-checkbox"});r.checked=this.selectedFiles.has(t.file.path),r.addEventListener("change",o=>{o.target.checked?this.selectedFiles.add(t.file.path):this.selectedFiles.delete(t.file.path)})}let i=n.createDiv({cls:"image-container"}),s=t.file;if(this.renderMediaThumbnail(i,s,t.name),i.addEventListener("click",()=>{this.isSelectionMode?(this.selectedFiles.has(t.file.path)?this.selectedFiles.delete(t.file.path):this.selectedFiles.add(t.file.path),this.refreshImages()):this.plugin.openMediaPreview(t.file)}),n.addEventListener("contextmenu",r=>{r.preventDefault(),this.showContextMenu(r,s)}),this.plugin.settings.showImageInfo){let r=n.createDiv({cls:"image-info"});r.createDiv({cls:"image-name",text:t.name}),r.createDiv({cls:"image-size",text:F(t.size)})}}showContextMenu(e,t){let n=new f.Menu;n.addItem(i=>{i.setTitle(this.plugin.t("openInNotes")).setIcon("search").onClick(()=>{this.plugin.openImageInNotes(t)})}),n.addItem(i=>{i.setTitle(this.plugin.t("copyPath")).setIcon("link").onClick(()=>{navigator.clipboard.writeText(t.path).then(()=>{new f.Notice(this.plugin.t("pathCopied"))}).catch(s=>{console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:",s),new f.Notice(this.plugin.t("error"))})})}),n.addItem(i=>{i.setTitle(this.plugin.t("copyLink")).setIcon("copy").onClick(()=>{let s=`[[${t.name}]]`;navigator.clipboard.writeText(s).then(()=>{new f.Notice(this.plugin.t("linkCopied"))}).catch(r=>{console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:",r),new f.Notice(this.plugin.t("error"))})})}),n.addItem(i=>{i.setTitle(this.plugin.t("openOriginal")).setIcon("external-link").onClick(()=>{let s=this.app.vault.getResourcePath(t);window.open(s,"_blank","noopener,noreferrer")})}),M(t.name)==="image"&&(n.addSeparator(),n.addItem(i=>{i.setTitle(this.plugin.t("organizing")).setIcon("folder-input").onClick(()=>this.organizeFile(t))}),this.isProcessableImage(t)&&n.addItem(i=>{i.setTitle(this.plugin.t("processing")).setIcon("image-down").onClick(()=>this.processFile(t))})),n.showAtPosition({x:e.clientX,y:e.clientY})}async organizeFile(e){let t=this.plugin.settings.organizeRules,n=ce(t,e);if(!n){new f.Notice(this.plugin.t("noMatchingFiles"));return}let i=await this.buildOrganizeContext(e),s=de(n,i);s.newPath!==e.path&&(await this.plugin.ensureFolderExists(s.newPath.substring(0,s.newPath.lastIndexOf("/"))),await this.app.fileManager.renameFile(e,s.newPath),new f.Notice(this.plugin.t("organizeComplete",{count:1})))}async organizeSelected(){if(this.selectedFiles.size===0)return;let e=this.plugin.settings.organizeRules,t=0;for(let n of this.selectedFiles){let i=this.app.vault.getAbstractFileByPath(n);if(!(i instanceof f.TFile))continue;let s=ce(e,i);if(!s)continue;let r=await this.buildOrganizeContext(i),o=de(s,r);if(o.newPath!==i.path)try{await this.plugin.ensureFolderExists(o.newPath.substring(0,o.newPath.lastIndexOf("/"))),await this.app.fileManager.renameFile(i,o.newPath),t++}catch(c){console.warn(`\u6574\u7406\u6587\u4EF6\u5931\u8D25: ${i.name}`,c)}}new f.Notice(this.plugin.t("organizeComplete",{count:t})),this.selectedFiles.clear(),this.isSelectionMode=!1,await this.refreshImages()}async buildOrganizeContext(e){let t=new Date(e.stat.mtime),n={file:e,date:t},i=e.extension.toLowerCase();if(i==="jpg"||i==="jpeg")try{let s=await this.app.vault.readBinary(e);n.exif=ve(s)}catch{}return n}getProcessSettings(){let e=this.plugin.settings;return{quality:e.defaultProcessQuality,format:e.defaultProcessFormat,watermark:e.watermarkText?{text:e.watermarkText,position:"bottom-right",opacity:.5}:void 0}}async processAndReplaceFile(e){let t=this.app.vault.getResourcePath(e),n=e.stat.size,i=await Fe(t,n,this.getProcessSettings()),s=Ce(i.format),r=e.name.replace(/\.[^.]+$/,""),o=e.parent?`${e.parent.path}/${r}${s}`:`${r}${s}`,c=await i.blob.arrayBuffer();if(o===e.path)return await this.app.vault.modifyBinary(e,c),{baseName:r,originalSize:n,newSize:i.newSize};let d=this.app.vault.getAbstractFileByPath(o);if(d&&d.path!==e.path)throw new Error(this.plugin.t("targetFileExists"));let g=await this.app.vault.readBinary(e);await this.app.vault.modifyBinary(e,c);try{await this.app.fileManager.renameFile(e,o)}catch(h){try{await this.app.vault.modifyBinary(e,g)}catch(u){console.error(`\u56DE\u6EDA\u5904\u7406\u540E\u7684\u6587\u4EF6\u5931\u8D25: ${e.name}`,u)}throw h}return{baseName:r,originalSize:n,newSize:i.newSize}}async processFile(e){if(!this.isProcessableImage(e)){new f.Notice(this.plugin.t("unsupportedFileType"));return}try{let{baseName:t,originalSize:n,newSize:i}=await this.processAndReplaceFile(e),s=Math.max(0,n-i);new f.Notice(`\u2705 ${t}: ${F(n)} \u2192 ${F(i)} (\u8282\u7701 ${F(s)})`)}catch(t){console.error(`\u5904\u7406\u5931\u8D25: ${e.name}`,t),new f.Notice(this.plugin.t("error")+`: ${e.name}`)}}async processSelected(){if(this.selectedFiles.size===0)return;let e=0,t=0,n=0;for(let s of this.selectedFiles){let r=this.app.vault.getAbstractFileByPath(s);if(r instanceof f.TFile){if(!this.isProcessableImage(r)){t++;continue}try{let{originalSize:o,newSize:c}=await this.processAndReplaceFile(r);e++,n+=Math.max(0,o-c)}catch(o){console.warn(`\u5904\u7406\u5931\u8D25: ${s}`,o)}}}let i=t>0?`\uFF0C\u8DF3\u8FC7 ${t} \u4E2A\u4E0D\u652F\u6301\u7684\u6587\u4EF6`:"";new f.Notice(`\u2705 \u5904\u7406\u5B8C\u6210: ${e} \u4E2A\u6587\u4EF6\uFF0C\u8282\u7701 ${F(n)}${i}`),this.selectedFiles.clear(),this.isSelectionMode=!1,await this.refreshImages()}};var I=require("obsidian");var ee=require("obsidian");var q=class extends ee.Modal{constructor(e,t,n,i){super(e);this.isDeleting=!1;this.plugin=t,this.images=n,this.onConfirm=i}onOpen(){let{contentEl:e}=this;e.empty();let t=h=>this.plugin.t(h);e.createEl("h2",{text:this.images.length===1?t("confirmDeleteFile").replace("{name}",this.images[0].name):t("confirmDeleteSelected").replace("{count}",String(this.images.length))});let i=e.createDiv({cls:"modal-warning"}).createEl("p");i.textContent=this.plugin.settings.useTrashFolder?t("deleteToTrash"):t("confirmClearAll"),i.style.color="var(--text-warning)",i.style.margin="16px 0";let s=e.createDiv({cls:"modal-file-list"});s.createEl("h3",{text:t("deleteToTrash")});let r=s.createEl("ul"),o=10;for(let h=0;h<Math.min(this.images.length,o);h++){let u=this.images[h];r.createEl("li",{text:`${u.name} (${F(u.size)})`})}this.images.length>o&&r.createEl("li",{text:`... ${this.images.length-o} ${t("filesScanned")}`});let c=e.createDiv({cls:"modal-buttons"});c.style.display="flex",c.style.gap="12px",c.style.justifyContent="flex-end",c.style.marginTop="20px",c.createEl("button",{text:t("cancel"),cls:"mod-cta"}).addEventListener("click",()=>this.close());let g=c.createEl("button",{text:this.plugin.settings.useTrashFolder?t("deleteToTrash"):t("delete"),cls:"mod-warning"});g.addEventListener("click",async()=>{if(!this.isDeleting){this.isDeleting=!0,g.setAttribute("disabled","true"),g.textContent=t("processing")||"\u5904\u7406\u4E2D...";try{await this.onConfirm(),this.close()}catch(h){console.error("\u5220\u9664\u64CD\u4F5C\u5931\u8D25:",h),new ee.Notice(t("deleteFailed")),this.isDeleting=!1,g.removeAttribute("disabled"),g.textContent=this.plugin.settings.useTrashFolder?t("deleteToTrash"):t("delete")}}})}onClose(){let{contentEl:e}=this;e.empty()}};var V="unreferenced-images-view",K=class extends I.ItemView{constructor(e,t){super(e);this.unreferencedImages=[];this.isScanning=!1;this.plugin=t}getViewType(){return V}getDisplayText(){return this.plugin.t("unreferencedMedia")}async onOpen(){let e=0;for(;!this.contentEl&&e<10;)await new Promise(t=>setTimeout(t,50)),e++;if(!this.contentEl){console.error("UnreferencedImagesView: contentEl not ready");return}this.contentEl.addClass("unreferenced-images-view"),this.isScanning||await this.scanUnreferencedImages()}async onClose(){}async scanUnreferencedImages(){if(!this.contentEl||this.isScanning)return;this.isScanning=!0,this.contentEl.empty();let e=this.contentEl.createDiv({cls:"loading-state"});e.createEl("div",{cls:"spinner"}),e.createDiv({text:this.plugin.t("scanningUnreferenced")});try{let t=await this.plugin.findUnreferenced();this.unreferencedImages=t.map(n=>({file:n,path:n.path,name:n.name,size:n.stat.size,modified:n.stat.mtime})),this.unreferencedImages.sort((n,i)=>i.size-n.size),await this.renderView()}catch(t){console.error("\u626B\u63CF\u56FE\u7247\u65F6\u51FA\u9519:",t),this.contentEl.createDiv({cls:"error-state",text:this.plugin.t("scanError")})}finally{this.isScanning=!1}}async renderView(){if(!this.contentEl)return;if(this.contentEl.empty(),this.renderHeader(),this.unreferencedImages.length===0){this.contentEl.createDiv({cls:"success-state",text:this.plugin.t("allMediaReferenced")});return}let e=this.contentEl.createDiv({cls:"stats-bar"});e.createSpan({text:this.plugin.t("unreferencedFound").replace("{count}",String(this.unreferencedImages.length)),cls:"stats-count"});let t=this.unreferencedImages.reduce((i,s)=>i+s.size,0);e.createSpan({text:this.plugin.t("totalSizeLabel").replace("{size}",F(t)),cls:"stats-size"});let n=this.contentEl.createDiv({cls:"unreferenced-list"});for(let i of this.unreferencedImages)this.renderImageItem(n,i)}renderHeader(){let e=this.contentEl.createDiv({cls:"unreferenced-header"});e.createEl("h2",{text:this.plugin.t("unreferencedMedia")}),e.createDiv({cls:"header-description"}).createSpan({text:this.plugin.t("unreferencedDesc")});let n=e.createEl("button",{cls:"refresh-button"});(0,I.setIcon)(n,"refresh-cw"),n.addEventListener("click",()=>this.scanUnreferencedImages());let i=e.createDiv({cls:"header-actions"}),s=i.createEl("button",{cls:"action-button"});(0,I.setIcon)(s,"copy"),s.addEventListener("click",()=>this.copyAllPaths());let r=i.createEl("button",{cls:"action-button danger"});(0,I.setIcon)(r,"trash-2"),r.addEventListener("click",()=>this.confirmDeleteAll())}renderThumbnailFallback(e,t,n){e.empty();let i=e.createDiv();i.style.width="100%",i.style.height="100%",i.style.display="flex",i.style.flexDirection="column",i.style.alignItems="center",i.style.justifyContent="center",i.style.gap="6px",i.style.color="var(--text-muted)";let s=i.createDiv();(0,I.setIcon)(s,t);let r=i.createDiv({text:n});r.style.fontSize="0.75em",r.style.textTransform="uppercase"}renderMediaThumbnail(e,t,n){let i=M(t.name),s=this.app.vault.getResourcePath(t);if(i==="image"){e.createEl("img",{attr:{src:s,alt:n}}).addEventListener("error",()=>{e.empty(),e.createDiv({cls:"image-error",text:this.plugin.t("imageLoadError")})});return}if(i==="video"){let r=e.createEl("video");r.src=s,r.muted=!0,r.preload="metadata",r.playsInline=!0,r.style.width="100%",r.style.height="100%",r.style.objectFit="cover",r.addEventListener("error",()=>{this.renderThumbnailFallback(e,"video","VIDEO")});return}if(i==="audio"){this.renderThumbnailFallback(e,"music","AUDIO");return}if(i==="document"){this.renderThumbnailFallback(e,"file-text","PDF");return}this.renderThumbnailFallback(e,"file","FILE")}renderImageItem(e,t){let n=e.createDiv({cls:"unreferenced-item"}),i=n.createDiv({cls:"item-thumbnail"});this.renderMediaThumbnail(i,t.file,t.name);let s=n.createDiv({cls:"item-info"});s.createDiv({cls:"item-name",text:t.name}),s.createDiv({cls:"item-path",text:t.path}),s.createDiv({cls:"item-size",text:F(t.size)});let r=n.createDiv({cls:"item-actions"}),o=r.createEl("button",{cls:"item-button"});(0,I.setIcon)(o,"search"),o.addEventListener("click",()=>{this.plugin.openImageInNotes(t.file)});let c=r.createEl("button",{cls:"item-button"});(0,I.setIcon)(c,"link"),c.addEventListener("click",()=>{navigator.clipboard.writeText(t.path).then(()=>{new I.Notice(this.plugin.t("pathCopied"))}).catch(g=>{console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:",g),new I.Notice(this.plugin.t("error"))})});let d=r.createEl("button",{cls:"item-button danger"});(0,I.setIcon)(d,"trash-2"),d.addEventListener("click",()=>{this.confirmDelete(t)}),n.addEventListener("contextmenu",g=>{g.preventDefault(),this.showContextMenu(g,t.file)})}showContextMenu(e,t){let n=new I.Menu;n.addItem(i=>{i.setTitle(this.plugin.t("openInNotes")).setIcon("search").onClick(()=>{this.plugin.openImageInNotes(t)})}),n.addItem(i=>{i.setTitle(this.plugin.t("copyPath")).setIcon("link").onClick(()=>{navigator.clipboard.writeText(t.path).then(()=>{new I.Notice(this.plugin.t("pathCopied"))}).catch(s=>{console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:",s),new I.Notice(this.plugin.t("error"))})})}),n.addItem(i=>{i.setTitle(this.plugin.t("copyLink")).setIcon("copy").onClick(()=>{let s=`[[${t.name}]]`;navigator.clipboard.writeText(s).then(()=>{new I.Notice(this.plugin.t("linkCopied"))}).catch(r=>{console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:",r),new I.Notice(this.plugin.t("error"))})})}),n.addItem(i=>{i.setTitle(this.plugin.t("openOriginal")).setIcon("external-link").onClick(()=>{let s=this.app.vault.getResourcePath(t);window.open(s,"_blank","noopener,noreferrer")})}),n.addSeparator(),n.addItem(i=>{i.setTitle(this.plugin.t("delete")).setIcon("trash-2").onClick(()=>{let s=this.unreferencedImages.find(r=>r.file.path===t.path)||{file:t,path:t.path,name:t.name,size:t.stat.size,modified:t.stat.mtime};this.confirmDelete(s)})}),n.showAtPosition({x:e.clientX,y:e.clientY})}async confirmDelete(e){new q(this.app,this.plugin,[e],async()=>{await this.plugin.safeDeleteFile(e.file)&&(this.unreferencedImages=this.unreferencedImages.filter(n=>n.file.path!==e.file.path),await this.renderView())}).open()}async confirmDeleteAll(){if(this.unreferencedImages.length===0){new I.Notice(this.plugin.t("noFilesToDelete"));return}new q(this.app,this.plugin,this.unreferencedImages,async()=>{let e=await Promise.all(this.unreferencedImages.map(i=>this.plugin.safeDeleteFile(i.file))),t=this.unreferencedImages.filter((i,s)=>e[s]).map(i=>i.name),n=this.unreferencedImages.filter((i,s)=>!e[s]).map(i=>i.name);t.length>0&&new I.Notice(this.plugin.t("processedFiles").replace("{count}",String(t.length))),n.length>0&&new I.Notice(this.plugin.t("processedFilesError").replace("{errors}",String(n.length))),await this.scanUnreferencedImages()}).open()}copyAllPaths(){let e=this.unreferencedImages.map(t=>t.path).join(`
`);navigator.clipboard.writeText(e).then(()=>{new I.Notice(this.plugin.t("copiedFilePaths").replace("{count}",String(this.unreferencedImages.length)))}).catch(t=>{console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:",t),new I.Notice(this.plugin.t("error"))})}};var m=require("obsidian");function z(l){if(!l||!l.trim())return!1;try{let e=decodeURIComponent(l).replace(/\\/g,"/");return e.startsWith("/")||/^[a-zA-Z]:/.test(e)||e.includes("\0")?!1:e.split("/").every(n=>n!==".."&&n!==".")}catch{return!1}}function Pe(l){if(!l||!l.trim())return!1;let a=l.trim().toLowerCase();return a.startsWith("http://")||a.startsWith("https://")?!0:a.startsWith("javascript:")||a.startsWith("data:")||a.startsWith("vbscript:")?!1:!a.includes(":")}function ge(l){return typeof l!="string"?"":l.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}var U="trash-management-view",Q=class extends m.ItemView{constructor(e,t){super(e);this.trashItems=[];this.isLoading=!1;this.plugin=t}getViewType(){return U}getDisplayText(){return this.plugin.t("trashManagement")}async onOpen(){let e=0;for(;!this.contentEl&&e<10;)await new Promise(t=>setTimeout(t,50)),e++;if(!this.contentEl){console.error("TrashManagementView: contentEl not ready");return}this.contentEl.addClass("trash-management-view"),await this.loadTrashItems()}async onClose(){}async loadTrashItems(){if(!this.contentEl||this.isLoading)return;this.isLoading=!0,this.contentEl.empty();let e=this.contentEl.createDiv({cls:"loading-state"});e.createEl("div",{cls:"spinner"}),e.createDiv({text:this.plugin.t("loadingTrashFiles")});try{let t=p(this.plugin.settings.trashFolder);if(!t||!z(t)){this.trashItems=[],await this.renderView();return}let n=this.plugin.app.vault.getAbstractFileByPath(t);if(!n||!(n instanceof m.TFolder)){this.trashItems=[],await this.renderView();return}let i=this.buildRefCountMap();this.trashItems=[];for(let s of n.children)if(s instanceof m.TFile){let r=this.extractOriginalPath(s.name),o=r&&$(r)||s.name,c=r?this.lookupRefCount(r,i):0;this.trashItems.push({file:s,path:s.path,rawName:s.name,name:o,size:s.stat.size,modified:s.stat.mtime,originalPath:r,referenceCount:c,selected:!1})}this.trashItems.sort((s,r)=>r.modified-s.modified),await this.renderView()}catch(t){console.error("\u52A0\u8F7D\u9694\u79BB\u6587\u4EF6\u5931\u8D25:",t),this.contentEl.createDiv({cls:"error-state",text:this.plugin.t("error")})}finally{this.isLoading=!1}}buildRefCountMap(){let e=new Map,t=this.app.vault.getMarkdownFiles();for(let n of t){let i=this.app.metadataCache.getFileCache(n);if(!i)continue;let s=[...i.embeds||[],...i.links||[]];for(let r of s){let o=p(r.link).toLowerCase(),c=($(o)||o).toLowerCase();e.set(o,(e.get(o)||0)+1),c!==o&&e.set(c,(e.get(c)||0)+1)}}return e}lookupRefCount(e,t){let n=p(e).toLowerCase(),i=($(n)||n).toLowerCase(),s=t.get(n)||0,r=t.get(i)||0;return Math.max(s,r)}extractOriginalPath(e){let t=e.indexOf("__");if(t===-1)return;let n=e.substring(t+2);return n&&p(O(n))||void 0}computeStats(){let e={},t=0,n=0;for(let i of this.trashItems){t+=i.size;let s=M(i.name)||"other";e[s]=(e[s]||0)+1,i.referenceCount===0&&n++}return{totalFiles:this.trashItems.length,totalSize:t,byType:e,unreferencedRate:this.trashItems.length>0?Math.round(n/this.trashItems.length*100):0}}async renderView(){if(!this.contentEl)return;if(this.contentEl.empty(),this.renderHeader(),this.trashItems.length>0&&this.renderDashboard(),this.trashItems.length===0){this.contentEl.createDiv({cls:"empty-state",text:this.plugin.t("trashFolderEmpty")});return}this.renderBatchToolbar();let e=this.contentEl.createDiv({cls:"trash-list"});for(let t of this.trashItems)this.renderTrashItem(e,t)}renderHeader(){let e=this.contentEl.createDiv({cls:"trash-header"});e.createEl("h2",{text:this.plugin.t("trashManagement")}),e.createDiv({cls:"header-description"}).createSpan({text:this.plugin.t("trashManagementDesc")});let n=e.createDiv({cls:"header-actions"}),i=n.createEl("button",{cls:"refresh-button"});(0,m.setIcon)(i,"refresh-cw"),i.addEventListener("click",()=>this.loadTrashItems()),i.title=this.plugin.t("refresh");let s=n.createEl("button",{cls:"action-button"});(0,m.setIcon)(s,"shield-check"),s.createSpan({text:` ${this.plugin.t("safeScan")}`}),s.disabled=!this.plugin.settings.safeScanEnabled,s.addEventListener("click",()=>this.runSafeScan()),s.title=this.plugin.t("safeScanDesc");let r=n.createEl("button",{cls:"action-button danger"});(0,m.setIcon)(r,"trash-2"),r.addEventListener("click",()=>this.confirmClearAll()),r.title=this.plugin.t("clearTrashTooltip")}renderDashboard(){let e=this.computeStats(),t=this.contentEl.createDiv({cls:"trash-dashboard"}),n=t.createDiv({cls:"dashboard-card"}),i=n.createDiv({cls:"dashboard-icon"});(0,m.setIcon)(i,"files"),n.createDiv({cls:"dashboard-value",text:String(e.totalFiles)}),n.createDiv({cls:"dashboard-label",text:this.plugin.t("filesInTrash").replace("{count}","")});let s=t.createDiv({cls:"dashboard-card"}),r=s.createDiv({cls:"dashboard-icon"});(0,m.setIcon)(r,"hard-drive"),s.createDiv({cls:"dashboard-value",text:F(e.totalSize)}),s.createDiv({cls:"dashboard-label",text:this.plugin.t("totalSize").replace("{size}","")});let o=t.createDiv({cls:"dashboard-card"}),c=o.createDiv({cls:"dashboard-icon"});(0,m.setIcon)(c,"pie-chart");let d=[];for(let[u,T]of Object.entries(e.byType))d.push(`${u}: ${T}`);o.createDiv({cls:"dashboard-value",text:d.join(", ")||"-"}),o.createDiv({cls:"dashboard-label",text:this.plugin.t("typeDistribution")});let g=t.createDiv({cls:"dashboard-card"}),h=g.createDiv({cls:"dashboard-icon"});(0,m.setIcon)(h,"unlink"),g.createDiv({cls:"dashboard-value",text:`${e.unreferencedRate}%`}),g.createDiv({cls:"dashboard-label",text:this.plugin.t("unreferencedRate")})}renderBatchToolbar(){let e=this.contentEl.createDiv({cls:"batch-toolbar"}),t=e.createEl("button",{cls:"toolbar-btn"});(0,m.setIcon)(t,"check-square"),t.createSpan({text:` ${this.plugin.t("selectAll")}`}),t.addEventListener("click",()=>{let r=this.trashItems.every(o=>o.selected);this.trashItems.forEach(o=>o.selected=!r),this.renderView()});let n=this.trashItems.filter(r=>r.selected).length;e.createSpan({cls:"selected-count",text:this.plugin.t("selectedCount",{count:n})});let i=e.createEl("button",{cls:"toolbar-btn success"});(0,m.setIcon)(i,"rotate-ccw"),i.createSpan({text:` ${this.plugin.t("batchRestore")}`}),i.addEventListener("click",()=>this.batchRestore());let s=e.createEl("button",{cls:"toolbar-btn danger"});(0,m.setIcon)(s,"trash-2"),s.createSpan({text:` ${this.plugin.t("batchDelete")}`}),s.addEventListener("click",()=>this.batchDelete())}renderTrashItem(e,t){let n=e.createDiv({cls:`trash-item ${t.selected?"selected":""}`}),i=n.createEl("input",{type:"checkbox",cls:"item-checkbox"});i.checked=t.selected,i.addEventListener("change",()=>{t.selected=i.checked,n.toggleClass("selected",t.selected);let u=this.contentEl.querySelector(".batch-toolbar .selected-count");if(u){let T=this.trashItems.filter(S=>S.selected).length;u.textContent=this.plugin.t("selectedCount",{count:T})}});let s=n.createDiv({cls:"item-thumbnail"});this.renderItemThumbnail(s,t);let r=n.createDiv({cls:"item-info"});r.createDiv({cls:"item-name",text:t.name}),t.originalPath&&r.createDiv({cls:"item-original-path",text:`${this.plugin.t("originalPath")}: ${t.originalPath}`});let o=r.createDiv({cls:"item-meta"});o.createSpan({cls:"item-size",text:F(t.size)}),o.createSpan({cls:"item-date",text:`${this.plugin.t("deletedTime")}: ${new Date(t.modified).toLocaleString()}`});let c=r.createSpan({cls:`ref-badge ${t.referenceCount>0?"ref-active":"ref-zero"}`,text:this.plugin.t("referencedBy",{count:t.referenceCount})}),d=n.createDiv({cls:"item-actions"}),g=d.createEl("button",{cls:"item-button success"});(0,m.setIcon)(g,"rotate-ccw"),g.addEventListener("click",()=>this.restoreFile(t)),g.title=this.plugin.t("restoreTooltip");let h=d.createEl("button",{cls:"item-button danger"});(0,m.setIcon)(h,"trash-2"),h.addEventListener("click",()=>this.confirmDelete(t)),h.title=this.plugin.t("permanentDeleteTooltip"),n.addEventListener("contextmenu",u=>{u.preventDefault(),this.showContextMenu(u,t)})}renderItemThumbnail(e,t){let n=M(t.name);if(n==="image"){let i=this.app.vault.getResourcePath(t.file);e.createEl("img",{attr:{src:i,alt:t.name}}).addEventListener("error",()=>{e.empty();let r=e.createDiv({cls:"thumb-icon"});(0,m.setIcon)(r,"image")})}else{let i=n==="video"?"video":n==="audio"?"music":n==="document"?"file-text":"file",s=e.createDiv({cls:"thumb-icon"});(0,m.setIcon)(s,i)}}async runSafeScan(){let e=this.plugin.settings;if(!e.safeScanEnabled){new m.Notice(this.plugin.t("safeScanDesc"));return}let t=Date.now(),n=1440*60*1e3,i=t-e.safeScanUnrefDays*n,s=e.safeScanMinSize;new m.Notice(this.plugin.t("safeScanStarted"));try{let r=await this.plugin.getReferencedImages(),o=this.plugin.fileIndex.isInitialized?this.plugin.fileIndex.getFiles().map(u=>this.app.vault.getAbstractFileByPath(u.path)).filter(u=>u instanceof m.TFile):await this.plugin.getAllImageFiles(),c=p(this.plugin.settings.trashFolder)||"",d=[];for(let u of o){if(c&&u.path.startsWith(c+"/"))continue;let T=p(u.path).toLowerCase(),S=u.name.toLowerCase();!(r.has(T)||r.has(S))&&u.stat.mtime<i&&u.stat.size>=s&&d.push(u)}if(d.length===0){new m.Notice(this.plugin.t("safeScanNoResults"));return}if(!await this.showConfirmModal(this.plugin.t("safeScanConfirm",{count:d.length,days:e.safeScanUnrefDays,size:F(s)})))return;let h=0;for(let u of d)await this.plugin.safeDeleteFile(u)&&h++;new m.Notice(this.plugin.t("safeScanComplete",{count:h})),await this.loadTrashItems()}catch(r){console.error("\u5B89\u5168\u626B\u63CF\u5931\u8D25:",r),new m.Notice(this.plugin.t("safeScanFailed"))}}async batchRestore(){let e=this.trashItems.filter(i=>i.selected);if(e.length===0){new m.Notice(this.plugin.t("noItemsSelected"));return}if(!await this.showConfirmModal(this.plugin.t("confirmBatchRestore",{count:e.length})))return;let n=0;for(let i of e)try{let s=p(i.originalPath||"");if(!s){let r=i.rawName.indexOf("__");r!==-1?s=p(O(i.rawName.substring(r+2))):s=p(i.rawName)}s&&await this.plugin.restoreFile(i.file,s)&&n++}catch(s){console.warn(`\u6062\u590D\u6587\u4EF6\u5931\u8D25: ${i.name}`,s)}new m.Notice(this.plugin.t("batchRestoreComplete",{count:n})),await this.loadTrashItems()}async batchDelete(){let e=this.trashItems.filter(s=>s.selected);if(e.length===0){new m.Notice(this.plugin.t("noItemsSelected"));return}if(!await this.showConfirmModal(this.plugin.t("confirmClearTrash").replace("{count}",String(e.length))))return;let i=(await Promise.all(e.map(s=>this.plugin.app.vault.delete(s.file).then(()=>!0).catch(()=>!1)))).filter(s=>s).length;new m.Notice(this.plugin.t("batchDeleteComplete").replace("{count}",String(i))),await this.loadTrashItems()}showContextMenu(e,t){let n=new m.Menu;n.addItem(i=>{i.setTitle(this.plugin.t("restore")).setIcon("rotate-ccw").onClick(()=>this.restoreFile(t))}),n.addItem(i=>{i.setTitle(this.plugin.t("permanentDelete")).setIcon("trash-2").onClick(()=>this.confirmDelete(t))}),n.addSeparator(),n.addItem(i=>{i.setTitle(this.plugin.t("copiedFileName")).setIcon("copy").onClick(()=>{navigator.clipboard.writeText(t.name).then(()=>{new m.Notice(this.plugin.t("fileNameCopied"))}).catch(s=>{console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:",s),new m.Notice(this.plugin.t("error"))})})}),n.addItem(i=>{i.setTitle(this.plugin.t("copiedOriginalPath")).setIcon("link").onClick(()=>{t.originalPath&&navigator.clipboard.writeText(t.originalPath).then(()=>{new m.Notice(this.plugin.t("originalPathCopied"))}).catch(s=>{console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:",s),new m.Notice(this.plugin.t("error"))})})}),n.showAtPosition({x:e.clientX,y:e.clientY})}async restoreFile(e){try{let t=p(e.originalPath||"");if(!t){let i=e.rawName.indexOf("__");i!==-1?t=p(O(e.rawName.substring(i+2))):t=p(e.rawName)}if(!t){new m.Notice(this.plugin.t("restoreFailed").replace("{message}",this.plugin.t("error")));return}if(!await this.plugin.restoreFile(e.file,t))return;this.trashItems=this.trashItems.filter(i=>i.file.path!==e.file.path),await this.renderView()}catch(t){console.error("\u6062\u590D\u6587\u4EF6\u5931\u8D25:",t),new m.Notice(this.plugin.t("restoreFailed").replace("{message}",t.message))}}showConfirmModal(e){return new Promise(t=>{let n=new m.Modal(this.plugin.app),i=!1;n.onClose=()=>{i||(i=!0,t(!1))},n.contentEl.createDiv({cls:"confirm-modal-content"},s=>{s.createDiv({text:e,cls:"confirm-modal-message"}),s.createDiv({cls:"confirm-modal-buttons"},r=>{let o=new m.ButtonComponent(r);o.setButtonText(this.plugin.t("cancel")),o.onClick(()=>{i=!0,n.close(),t(!1)});let c=new m.ButtonComponent(r);c.setButtonText(this.plugin.t("confirm")),c.setCta(),c.onClick(()=>{i=!0,n.close(),t(!0)})})}),n.open()})}async confirmDelete(e){if(await this.showConfirmModal(this.plugin.t("confirmDeleteFile").replace("{name}",e.name)))try{await this.plugin.app.vault.delete(e.file),new m.Notice(this.plugin.t("fileDeleted").replace("{name}",e.name)),this.trashItems=this.trashItems.filter(n=>n.file.path!==e.file.path),await this.renderView()}catch(n){console.error("\u5220\u9664\u6587\u4EF6\u5931\u8D25:",n),new m.Notice(this.plugin.t("deleteFailed"))}}async confirmClearAll(){if(this.trashItems.length===0){new m.Notice(this.plugin.t("trashEmpty"));return}if(await this.showConfirmModal(this.plugin.t("confirmClearTrash").replace("{count}",String(this.trashItems.length)))){let t=await Promise.all(this.trashItems.map(s=>this.plugin.app.vault.delete(s.file).then(()=>!0).catch(()=>!1))),n=t.filter(s=>s).length,i=t.filter(s=>!s).length;n>0&&new m.Notice(this.plugin.t("batchDeleteComplete").replace("{count}",String(n))),i>0&&new m.Notice(this.plugin.t("batchDeleteComplete").replace("{count}",String(i))+" ("+this.plugin.t("error")+")"),await this.loadTrashItems()}}getFileIcon(e){switch(M(`filename.${e}`)){case"image":return"image";case"video":return"video";case"audio":return"music";case"document":return"file-text";default:return"file"}}};var D=require("obsidian");function Me(l,a,e){let t=document.createElement("canvas");t.width=a,t.height=e;let n=t.getContext("2d");n.drawImage(l,0,0,a,e);let s=n.getImageData(0,0,a,e).data,r=[];for(let o=0;o<s.length;o+=4)r.push(.299*s[o]+.587*s[o+1]+.114*s[o+2]);return r}function et(l,a,e){let t=new Array(e*e);for(let n=0;n<e;n++)for(let i=0;i<e;i++){let s=0;for(let r=0;r<a;r++)for(let o=0;o<a;o++)s+=l[r*a+o]*Math.cos(Math.PI*(2*r+1)*n/(2*a))*Math.cos(Math.PI*(2*o+1)*i/(2*a));t[n*e+i]=s}return t}function tt(l){let t=Me(l,32,32),n=et(t,32,8),s=[...n.slice(1)].sort((c,d)=>c-d),r=s[Math.floor(s.length/2)],o="";for(let c=0;c<64;c++)o+=n[c]>r?"1":"0";return ke(o)}function nt(l){let a=Me(l,9,8),e="";for(let t=0;t<8;t++)for(let n=0;n<8;n++)e+=a[t*9+n]<a[t*9+n+1]?"1":"0";return ke(e)}function ke(l){let a="";for(let e=0;e<l.length;e+=4)a+=parseInt(l.substring(e,e+4),2).toString(16);return a}async function Le(l){let a=await it(l),e=tt(a),t=nt(a);return e+t}function it(l,a=8e3){return new Promise((e,t)=>{let n=new Image,i=!1,s=setTimeout(()=>{i||(i=!0,n.src="",t(new Error(`Failed to load image (timeout): ${l}`)))},a);n.crossOrigin="anonymous",n.onload=()=>{i||(i=!0,clearTimeout(s),e(n))},n.onerror=()=>{i||(i=!0,clearTimeout(s),t(new Error(`Failed to load image: ${l}`)))},n.src=l})}function st(l,a){if(l.length!==a.length)throw new Error(`Hash length mismatch: ${l.length} vs ${a.length}`);let e=0;for(let t=0;t<l.length;t++){let n=parseInt(l[t],16),i=parseInt(a[t],16),s=n^i;for(;s;)e+=s&1,s>>=1}return e}function at(l,a){let e=l.length*4,t=st(l,a);return Math.round((1-t/e)*100)}function Ae(l,a=90){let e=Array.from(l.entries()),t=new Set,n=[];for(let i=0;i<e.length;i++){let[s,r]=e[i];if(t.has(s))continue;let o={hash:r,files:[{path:s,hash:r,similarity:100}]};for(let c=i+1;c<e.length;c++){let[d,g]=e[c];if(t.has(d))continue;let h=at(r,g);h>=a&&(o.files.push({path:d,hash:g,similarity:h}),t.add(d))}o.files.length>1&&(t.add(s),n.push(o))}return n}var H="duplicate-detection-view",te=class extends D.ItemView{constructor(e,t){super(e);this.duplicateGroups=[];this.isScanning=!1;this.scanProgress={current:0,total:0};this.lastProgressAt=0;this.plugin=t}getViewType(){return H}getDisplayText(){return this.plugin.t("duplicateDetection")}async onOpen(){let e=0;for(;!this.contentEl&&e<10;)await new Promise(t=>setTimeout(t,50)),e++;if(!this.contentEl){console.error("DuplicateDetectionView: contentEl not ready");return}this.ensureStyles(),this.isScanning=!1,this.scanProgress={current:0,total:0},this.contentEl.addClass("duplicate-detection-view"),await this.renderView()}async onClose(){this.isScanning=!1}async renderView(){if(!this.contentEl)return;if(this.ensureStyles(),this.contentEl.empty(),this.renderHeader(),this.isScanning){this.renderProgress();return}if(this.duplicateGroups.length===0){this.contentEl.createDiv({cls:"empty-state",text:this.plugin.t("noDuplicatesFound")});return}let e=this.duplicateGroups.reduce((s,r)=>s+r.files.length-1,0),t=this.contentEl.createDiv({cls:"stats-bar"});t.createSpan({text:this.plugin.t("duplicateGroupsFound",{groups:this.duplicateGroups.length,files:e}),cls:"stats-count"});let n=t.createEl("button",{cls:"action-button"});(0,D.setIcon)(n,"broom"),n.createSpan({text:` ${this.plugin.t("quarantineAllDuplicates")}`}),n.addEventListener("click",()=>this.quarantineAllDuplicates());let i=this.contentEl.createDiv({cls:"duplicate-groups"});for(let s=0;s<this.duplicateGroups.length;s++)this.renderDuplicateGroup(i,this.duplicateGroups[s],s+1)}renderHeader(){let e=this.contentEl.createDiv({cls:"duplicate-header"});e.createEl("h2",{text:this.plugin.t("duplicateDetection")}),e.createDiv({cls:"header-description"}).createSpan({text:this.plugin.t("duplicateDetectionDesc")});let n=e.createDiv({cls:"header-actions"}),i=n.createEl("button",{cls:"action-button primary"});(0,D.setIcon)(i,"search"),i.createSpan({text:` ${this.plugin.t("startScan")}`}),i.addEventListener("click",()=>this.startScan()),n.createSpan({cls:"threshold-label",text:this.plugin.t("similarityThreshold",{value:this.plugin.settings.duplicateThreshold})})}renderProgress(){let e=this.contentEl.createDiv({cls:"scan-progress"}),n=e.createDiv({cls:"progress-bar"}).createDiv({cls:"progress-fill"}),i=this.scanProgress.total>0?Math.round(this.scanProgress.current/this.scanProgress.total*100):0;n.style.width=`${i}%`,e.createDiv({cls:"progress-text",text:this.plugin.t("scanProgress",{current:this.scanProgress.current,total:this.scanProgress.total})})}compareDuplicateFiles(e,t){let n=this.app.vault.getAbstractFileByPath(e),i=this.app.vault.getAbstractFileByPath(t);return n instanceof D.TFile&&i instanceof D.TFile?i.stat.mtime-n.stat.mtime||i.stat.size-n.stat.size||e.localeCompare(t):n instanceof D.TFile?-1:i instanceof D.TFile?1:e.localeCompare(t)}normalizeDuplicateGroup(e){return{...e,files:[...e.files].sort((t,n)=>this.compareDuplicateFiles(t.path,n.path))}}async startScan(){if(this.isScanning){let e=Date.now();if(this.lastProgressAt&&e-this.lastProgressAt>15e3)this.isScanning=!1;else return}this.isScanning=!0,this.duplicateGroups=[],this.lastProgressAt=Date.now();try{let e=[];if(this.plugin.fileIndex.isInitialized){for(let s of this.plugin.fileIndex.getFiles())if(M(s.name)==="image"){let r=this.app.vault.getAbstractFileByPath(s.path);r instanceof D.TFile&&e.push(r)}}else{let s=await this.plugin.getAllImageFiles();e.push(...s.filter(r=>M(r.name)==="image"))}this.scanProgress={current:0,total:e.length},this.lastProgressAt=Date.now(),await this.renderView();let t=new Map,n=5;for(let s=0;s<e.length;s+=n){let r=e.slice(s,s+n);await Promise.all(r.map(async d=>{try{let g=this.app.vault.getResourcePath(d),h=await Le(g);t.set(d.path,h)}catch(g){console.warn(`Hash computation failed for ${d.name}:`,g)}})),this.scanProgress.current=Math.min(s+n,e.length),this.lastProgressAt=Date.now();let o=this.contentEl.querySelector(".progress-fill"),c=this.contentEl.querySelector(".progress-text");if(o&&c){let d=Math.round(this.scanProgress.current/this.scanProgress.total*100);o.style.width=`${d}%`,c.textContent=this.plugin.t("scanProgress",{current:this.scanProgress.current,total:this.scanProgress.total})}await new Promise(d=>setTimeout(d,10))}let i=this.plugin.settings.duplicateThreshold;if(this.duplicateGroups=Ae(t,i).map(s=>this.normalizeDuplicateGroup(s)),this.duplicateGroups.length===0)new D.Notice(this.plugin.t("noDuplicatesFound"));else{let s=this.duplicateGroups.reduce((r,o)=>r+o.files.length-1,0);new D.Notice(this.plugin.t("duplicatesFound",{groups:this.duplicateGroups.length,files:s}))}}catch(e){console.error("Duplicate detection failed:",e),new D.Notice(this.plugin.t("scanError"))}finally{this.isScanning=!1,await this.renderView()}}ensureStyles(){document.getElementById("obsidian-media-toolkit-styles")||document.getElementById("image-manager-styles")||this.plugin.addStyle()}renderDuplicateGroup(e,t,n){t.files.sort((o,c)=>this.compareDuplicateFiles(o.path,c.path));let i=e.createDiv({cls:"duplicate-group"}),s=i.createDiv({cls:"group-header"});s.createSpan({cls:"group-title",text:this.plugin.t("duplicateGroup",{index:n})}),s.createSpan({cls:"group-count",text:`${t.files.length} ${this.plugin.t("files")}`});let r=i.createDiv({cls:"group-files"});for(let o=0;o<t.files.length;o++){let c=t.files[o],d=this.app.vault.getAbstractFileByPath(c.path);if(!(d instanceof D.TFile))continue;let g=r.createDiv({cls:`group-file ${o===0?"keep-suggestion":"duplicate-suggestion"}`}),h=g.createDiv({cls:"file-thumbnail"}),u=this.app.vault.getResourcePath(d);h.createEl("img",{attr:{src:u,alt:d.name}}).addEventListener("error",()=>{h.empty();let k=h.createDiv();(0,D.setIcon)(k,"image")});let S=g.createDiv({cls:"file-info"});S.createDiv({cls:"file-name",text:d.name}),S.createDiv({cls:"file-path",text:d.path});let E=S.createDiv({cls:"file-meta"});if(E.createSpan({text:F(d.stat.size)}),E.createSpan({text:` | ${new Date(d.stat.mtime).toLocaleDateString()}`}),E.createSpan({cls:"similarity-badge",text:` ${c.similarity}%`}),o===0)g.createSpan({cls:"keep-badge",text:this.plugin.t("suggestKeep")});else{let k=g.createEl("button",{cls:"quarantine-btn"});(0,D.setIcon)(k,"archive"),k.createSpan({text:` ${this.plugin.t("quarantine")}`}),k.addEventListener("click",async()=>{if(await this.plugin.safeDeleteFile(d)){if(t.files.splice(o,1),t.files.length<=1){let P=this.duplicateGroups.indexOf(t);P>=0&&this.duplicateGroups.splice(P,1)}await this.renderView()}})}}}async quarantineAllDuplicates(){let e=0;for(let t of this.duplicateGroups){t.files.sort((n,i)=>this.compareDuplicateFiles(n.path,i.path));for(let n=1;n<t.files.length;n++){let i=t.files[n],s=this.app.vault.getAbstractFileByPath(i.path);if(!(s instanceof D.TFile))continue;await this.plugin.safeDeleteFile(s)&&e++}}new D.Notice(this.plugin.t("duplicatesQuarantined",{count:e})),this.duplicateGroups=[],await this.renderView()}};var _=require("obsidian"),ne=class extends _.Modal{constructor(e,t,n,i=[]){super(e);this.currentIndex=0;this.allFiles=[];this.keydownHandler=null;this.plugin=t,this.file=n,this.allFiles=i.length>0?i:[n];let s=this.allFiles.findIndex(r=>r.path===n.path);this.currentIndex=s>=0?s:0}onOpen(){let{contentEl:e,modalEl:t}=this;t.addClass("media-preview-modal");let n=e.createDiv({cls:"preview-close"});n.textContent="\xD7",n.addEventListener("click",()=>this.close());let i=e.createDiv({cls:"preview-container"});this.renderMedia(i),this.allFiles.length>1&&this.renderNavigation(i),this.renderInfoBar(e),this.plugin.settings.enableKeyboardNav&&this.registerKeyboardNav()}renderMedia(e){e.empty();let t=this.allFiles[this.currentIndex],n=t.extension.toLowerCase(),i=["png","jpg","jpeg","gif","webp","svg","bmp"].includes(n),s=["mp4","mov","avi","mkv","webm"].includes(n),r=["mp3","wav","ogg","m4a","flac"].includes(n),o=n==="pdf";if(i)e.createEl("img",{cls:"preview-image",attr:{src:this.app.vault.getResourcePath(t)}}).addEventListener("error",()=>{e.empty(),e.createDiv({cls:"preview-error",text:this.plugin.t("imageLoadError")||"Failed to load image"})});else if(s){let c=e.createEl("video",{cls:"preview-video",attr:{controls:"true"}});c.src=this.app.vault.getResourcePath(t)}else if(r){let c=e.createEl("audio",{cls:"preview-audio",attr:{controls:"true"}});c.src=this.app.vault.getResourcePath(t)}else if(o){let c=e.createEl("iframe",{cls:"preview-pdf",attr:{src:this.app.vault.getResourcePath(t),sandbox:"allow-scripts"}})}else e.createDiv({cls:"preview-unsupported",text:this.plugin.t("unsupportedFileType")})}renderNavigation(e){let t=e.createDiv({cls:"preview-nav"}),n=t.createEl("button",{cls:"nav-button prev"});n.textContent="\u2039",n.addEventListener("click",s=>{s.stopPropagation(),this.prev()}),t.createSpan({text:`${this.currentIndex+1} / ${this.allFiles.length}`,cls:"nav-info"});let i=t.createEl("button",{cls:"nav-button next"});i.textContent="\u203A",i.addEventListener("click",s=>{s.stopPropagation(),this.next()})}renderInfoBar(e){let t=this.allFiles[this.currentIndex],n=e.createDiv({cls:"preview-info-bar"});n.createDiv({cls:"info-name",text:t.name});let i=n.createDiv({cls:"info-actions"}),s=i.createEl("button");s.textContent=this.plugin.t("copyPathBtn"),s.addEventListener("click",()=>{navigator.clipboard.writeText(t.path).then(()=>{new _.Notice(this.plugin.t("pathCopied"))}).catch(c=>{console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:",c),new _.Notice(this.plugin.t("error"))})});let r=i.createEl("button");r.textContent=this.plugin.t("copyLinkBtn"),r.addEventListener("click",()=>{let c=`[[${t.name}]]`;navigator.clipboard.writeText(c).then(()=>{new _.Notice(this.plugin.t("linkCopied"))}).catch(d=>{console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:",d),new _.Notice(this.plugin.t("error"))})});let o=i.createEl("button");o.textContent=this.plugin.t("findInNotes"),o.addEventListener("click",()=>{this.close(),this.plugin.openImageInNotes(t)})}registerKeyboardNav(){this.keydownHandler=e=>{switch(e.key){case"ArrowLeft":this.prev();break;case"ArrowRight":this.next();break;case"Escape":this.close();break}},this.modalEl.addEventListener("keydown",this.keydownHandler)}prev(){this.currentIndex>0&&(this.currentIndex--,this.updateContent())}next(){this.currentIndex<this.allFiles.length-1&&(this.currentIndex++,this.updateContent())}updateContent(){if(!this.contentEl)return;let e=this.contentEl.querySelector(".preview-container");if(e){this.renderMedia(e);let n=e.querySelector(".preview-nav");n&&n.remove(),this.allFiles.length>1&&this.renderNavigation(e)}let t=this.contentEl.querySelector(".preview-info-bar");t&&t.remove(),this.renderInfoBar(this.contentEl)}onClose(){let{contentEl:e,modalEl:t}=this;this.keydownHandler&&(t.removeEventListener("keydown",this.keydownHandler),this.keydownHandler=null),e.empty()}};var w=require("obsidian");var b={imageFolder:"",thumbnailSize:"medium",showImageInfo:!0,sortBy:"name",sortOrder:"asc",autoRefresh:!0,defaultAlignment:"center",useTrashFolder:!0,trashFolder:"obsidian-media-toolkit-trash",autoCleanupTrash:!1,trashCleanupDays:30,enableImages:!0,enableVideos:!0,enableAudio:!0,enablePDF:!0,pageSize:50,enablePreviewModal:!0,enableKeyboardNav:!0,language:"system",safeScanEnabled:!1,safeScanUnrefDays:30,safeScanMinSize:5*1024*1024,duplicateThreshold:90,organizeRules:[{name:"Default",enabled:!1,pathTemplate:"Media/{year}/{month}",renameTemplate:"{name}",matchExtensions:"jpg,jpeg,png,gif,webp"}],defaultProcessQuality:80,defaultProcessFormat:"webp",watermarkText:""},ie=class extends w.PluginSettingTab{constructor(a,e){super(a,e),this.plugin=e}t(a){return this.plugin.t(a)}display(){let{containerEl:a}=this;a.empty(),a.createEl("h2",{text:this.t("pluginSettings")}),new w.Setting(a).setName(this.t("mediaFolder")).setDesc(this.t("mediaFolderDesc")).addText(e=>e.setPlaceholder("attachments/media").setValue(this.plugin.settings.imageFolder).onChange(async t=>{this.plugin.settings.imageFolder=p(t),this.plugin.clearCache(),await this.plugin.saveSettings()})),new w.Setting(a).setName(this.t("thumbnailSize")).setDesc(this.t("thumbnailSizeDesc")).addDropdown(e=>e.addOption("small",this.t("thumbnailSmall")).addOption("medium",this.t("thumbnailMedium")).addOption("large",this.t("thumbnailLarge")).setValue(this.plugin.settings.thumbnailSize).onChange(async t=>{this.plugin.settings.thumbnailSize=t,await this.plugin.saveSettings()})),new w.Setting(a).setName(this.t("defaultSortBy")).setDesc(this.t("sortByDesc")).addDropdown(e=>e.addOption("name",this.t("sortByName")).addOption("date",this.t("sortByDate")).addOption("size",this.t("sortBySize")).setValue(this.plugin.settings.sortBy).onChange(async t=>{this.plugin.settings.sortBy=t,await this.plugin.saveSettings()})),new w.Setting(a).setName(this.t("sortOrder")).setDesc(this.t("sortOrderDesc")).addDropdown(e=>e.addOption("asc",this.t("sortAsc")).addOption("desc",this.t("sortDesc")).setValue(this.plugin.settings.sortOrder).onChange(async t=>{this.plugin.settings.sortOrder=t,await this.plugin.saveSettings()})),new w.Setting(a).setName(this.t("showImageInfo")).setDesc(this.t("showImageInfoDesc")).addToggle(e=>e.setValue(this.plugin.settings.showImageInfo).onChange(async t=>{this.plugin.settings.showImageInfo=t,await this.plugin.saveSettings()})),new w.Setting(a).setName(this.t("autoRefresh")).setDesc(this.t("autoRefreshDesc")).addToggle(e=>e.setValue(this.plugin.settings.autoRefresh).onChange(async t=>{this.plugin.settings.autoRefresh=t,await this.plugin.saveSettings()})),new w.Setting(a).setName(this.t("defaultAlignment")).setDesc(this.t("alignmentDesc")).addDropdown(e=>e.addOption("left",this.t("alignLeft")).addOption("center",this.t("alignCenter")).addOption("right",this.t("alignRight")).setValue(this.plugin.settings.defaultAlignment).onChange(async t=>{this.plugin.settings.defaultAlignment=t,await this.plugin.saveSettings()})),a.createEl("hr",{cls:"settings-divider"}),a.createEl("h3",{text:this.t("safeDeleteSettings")}),new w.Setting(a).setName(this.t("useTrashFolder")).setDesc(this.t("useTrashFolderDesc")).addToggle(e=>e.setValue(this.plugin.settings.useTrashFolder).onChange(async t=>{this.plugin.settings.useTrashFolder=t,await this.plugin.saveSettings()})),new w.Setting(a).setName(this.t("trashFolderPath")).setDesc(this.t("trashFolderPathDesc")).addText(e=>e.setPlaceholder("obsidian-media-toolkit-trash").setValue(this.plugin.settings.trashFolder).onChange(async t=>{this.plugin.settings.trashFolder=p(t),await this.plugin.saveSettings()})),new w.Setting(a).setName(this.t("autoCleanupTrash")).setDesc(this.t("autoCleanupTrashDesc")).addToggle(e=>e.setValue(this.plugin.settings.autoCleanupTrash).onChange(async t=>{this.plugin.settings.autoCleanupTrash=t,await this.plugin.saveSettings()})),new w.Setting(a).setName(this.t("cleanupDays")).setDesc(this.t("cleanupDaysDesc")).addText(e=>e.setPlaceholder("30").setValue(String(this.plugin.settings.trashCleanupDays)).onChange(async t=>{let n=parseInt(t,10);!isNaN(n)&&n>0&&(this.plugin.settings.trashCleanupDays=n,await this.plugin.saveSettings())})),a.createEl("hr",{cls:"settings-divider"}),a.createEl("h3",{text:this.t("safeScanSettings")}),new w.Setting(a).setName(this.t("safeScan")).setDesc(this.t("safeScanEnabledDesc")).addToggle(e=>e.setValue(this.plugin.settings.safeScanEnabled).onChange(async t=>{this.plugin.settings.safeScanEnabled=t,await this.plugin.saveSettings()})),new w.Setting(a).setName(this.t("safeScanUnrefDays")).setDesc(this.t("safeScanUnrefDaysDesc")).addText(e=>e.setPlaceholder("30").setValue(String(this.plugin.settings.safeScanUnrefDays)).onChange(async t=>{let n=parseInt(t,10);!isNaN(n)&&n>0&&(this.plugin.settings.safeScanUnrefDays=n,await this.plugin.saveSettings())})),new w.Setting(a).setName(this.t("safeScanMinSize")).setDesc(this.t("safeScanMinSizeDesc")).addText(e=>e.setPlaceholder("5").setValue(String(Number((this.plugin.settings.safeScanMinSize/(1024*1024)).toFixed(2)))).onChange(async t=>{let n=parseFloat(t);!isNaN(n)&&n>=0&&(this.plugin.settings.safeScanMinSize=Math.round(n*1024*1024),await this.plugin.saveSettings())})),a.createEl("hr",{cls:"settings-divider"}),a.createEl("h3",{text:this.t("duplicateDetectionSettings")}),new w.Setting(a).setName(this.t("duplicateThresholdSetting")).setDesc(this.t("duplicateThresholdDesc")).addText(e=>e.setPlaceholder("90").setValue(String(this.plugin.settings.duplicateThreshold)).onChange(async t=>{let n=parseInt(t,10);!isNaN(n)&&n>=50&&n<=100&&(this.plugin.settings.duplicateThreshold=n,await this.plugin.saveSettings())})),a.createEl("hr",{cls:"settings-divider"}),a.createEl("h3",{text:this.t("mediaTypes")}),new w.Setting(a).setName(this.t("enableImageSupport")).setDesc(this.t("enableImageSupportDesc")).addToggle(e=>e.setValue(this.plugin.settings.enableImages).onChange(async t=>{this.plugin.settings.enableImages=t,this.plugin.clearCache(),await this.plugin.saveSettings()})),new w.Setting(a).setName(this.t("enableVideoSupport")).setDesc(this.t("enableVideoSupportDesc")).addToggle(e=>e.setValue(this.plugin.settings.enableVideos).onChange(async t=>{this.plugin.settings.enableVideos=t,this.plugin.clearCache(),await this.plugin.saveSettings()})),new w.Setting(a).setName(this.t("enableAudioSupport")).setDesc(this.t("enableAudioSupportDesc")).addToggle(e=>e.setValue(this.plugin.settings.enableAudio).onChange(async t=>{this.plugin.settings.enableAudio=t,this.plugin.clearCache(),await this.plugin.saveSettings()})),new w.Setting(a).setName(this.t("enablePDFSupport")).setDesc(this.t("enablePDFSupportDesc")).addToggle(e=>e.setValue(this.plugin.settings.enablePDF).onChange(async t=>{this.plugin.settings.enablePDF=t,this.plugin.clearCache(),await this.plugin.saveSettings()})),a.createEl("hr",{cls:"settings-divider"}),a.createEl("h3",{text:this.t("viewSettings")}),new w.Setting(a).setName(this.t("interfaceLanguage")).setDesc(this.t("languageDesc")).addDropdown(e=>e.addOption("system",this.t("languageSystem")).addOption("zh","\u4E2D\u6587").addOption("en","English").setValue(this.plugin.settings.language).onChange(async t=>{this.plugin.settings.language=t,await this.plugin.saveSettings()})),new w.Setting(a).setName(this.t("pageSize")).setDesc(this.t("pageSizeDesc")).addText(e=>e.setPlaceholder("50").setValue(String(this.plugin.settings.pageSize)).onChange(async t=>{let n=parseInt(t,10);!isNaN(n)&&n>0&&(this.plugin.settings.pageSize=n,await this.plugin.saveSettings())})),new w.Setting(a).setName(this.t("enablePreviewModal")).setDesc(this.t("enablePreviewModalDesc")).addToggle(e=>e.setValue(this.plugin.settings.enablePreviewModal).onChange(async t=>{this.plugin.settings.enablePreviewModal=t,await this.plugin.saveSettings()})),new w.Setting(a).setName(this.t("enableKeyboardNav")).setDesc(this.t("enableKeyboardNavDesc")).addToggle(e=>e.setValue(this.plugin.settings.enableKeyboardNav).onChange(async t=>{this.plugin.settings.enableKeyboardNav=t,await this.plugin.saveSettings()})),a.createEl("hr",{cls:"settings-divider"}),a.createEl("h3",{text:this.t("keyboardShortcuts")}),a.createEl("p",{text:this.t("shortcutsDesc"),cls:"settings-description"}),a.createEl("ul",{cls:"settings-list"}).createEl("li",{text:this.t("shortcutOpenLibrary")}),a.createEl("ul",{cls:"settings-list"}).createEl("li",{text:this.t("shortcutFindUnreferenced")}),a.createEl("ul",{cls:"settings-list"}).createEl("li",{text:this.t("shortcutOpenTrash")}),a.createEl("h3",{text:this.t("commands")}),a.createEl("p",{text:this.t("commandsDesc"),cls:"settings-description"}),a.createEl("ul",{cls:"settings-list"}).createEl("li",{text:this.t("cmdOpenLibrary")}),a.createEl("ul",{cls:"settings-list"}).createEl("li",{text:this.t("cmdFindUnreferenced")}),a.createEl("ul",{cls:"settings-list"}).createEl("li",{text:this.t("cmdTrashManagement")}),a.createEl("ul",{cls:"settings-list"}).createEl("li",{text:this.t("cmdAlignLeft")}),a.createEl("ul",{cls:"settings-list"}).createEl("li",{text:this.t("cmdAlignCenter")}),a.createEl("ul",{cls:"settings-list"}).createEl("li",{text:this.t("cmdAlignRight")})}};var se=class{static stripExistingAlignment(a){let e=a.trim(),t=e.match(/^===\s*(left|center|right)\s*===\s*([\s\S]*?)\s*===$/i);if(t)return t[2].trim();e=e.replace(/^\{\s*align\s*=\s*(left|center|right)\s*\}\s*/i,"").trim();let n=e.match(/^!?\[\[([^\]|]+)\|([^\]]+)\]\]$/);if(n){let i=n[2].toLowerCase();if(i==="left"||i==="center"||i==="right")return`![[${n[1]}]]`}return e=e.replace(/^\{\s*\.(left|center|right)\s*\}$/i,"").trim(),e}static applyAlignment(a,e){let t=this.stripExistingAlignment(a).trim(),n=t.match(/^!?\[\[([^\]]+)\]\]$/);if(n)return`![[${n[1]}|${e}]]`;let i=t.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);if(i){let s=i[1];return`![[${i[2]}|${e}]]`}return a}static getAlignment(a){let e=a.match(/!?\[\[([^\]|]+)\|([^\]]+)\]\]/);if(e){let s=e[2].toLowerCase();if(s==="left"||s==="center"||s==="right")return s}let t=a.match(/^===\s*(left|center|right)\s*===/i);if(t){let s=t[1].toLowerCase();if(s==="left"||s==="center"||s==="right")return s}let n=a.match(/{\s*align\s*=\s*(\w+)\s*}/i);if(n){let s=n[1].toLowerCase();if(s==="left"||s==="center"||s==="right")return s}let i=a.match(/\{\s*\.(left|center|right)\s*\}/i);return i?i[1].toLowerCase():null}static toHTML(a,e="",t="center"){let n={left:"display: block; margin-left: 0; margin-right: auto;",center:"display: block; margin-left: auto; margin-right: auto;",right:"display: block; margin-left: auto; margin-right: 0;"};return`<img src="${ge(a)}" alt="${ge(e)}" style="${n[t]}" />`}};var ze=require("obsidian");var ae=class{constructor(a){this.plugin=a}register(){this.plugin.registerMarkdownPostProcessor((a,e)=>{this.processAlignment(a)})}processAlignment(a){let e=document.createTreeWalker(a,NodeFilter.SHOW_TEXT,null),t=[],n;for(;n=e.nextNode();){let i=n.textContent||"",s=n.parentElement;s&&(i.includes("===")&&(i.includes("center")||i.includes("left")||i.includes("right"))?t.push({node:n,parent:s}):(i.includes("|center")||i.includes("|left")||i.includes("|right"))&&t.push({node:n,parent:s}))}for(let{node:i,parent:s}of t)this.processNode(i,s)}processNode(a,e){let t=a.textContent||"",n=0,i=document.createDocumentFragment(),s=/!?\[\[([^|\]]+)\|(center|left|right)\]\]/gi,r;for(;(r=s.exec(t))!==null;){r.index>n&&i.appendChild(document.createTextNode(t.substring(n,r.index)));let o=r[1].trim(),c=r[2].toLowerCase(),d=document.createElement("div");d.className=`alignment-${c}`,d.style.textAlign=c,d.style.margin="10px 0",this.renderImageSync(`![[${o}]]`,d),i.appendChild(d),n=r.index+r[0].length}if(n===0){let o=/===\s*(center|left|right)\s*===\s*([\s\S]*?)\s*===/gi;for(n=0;(r=o.exec(t))!==null;){r.index>n&&i.appendChild(document.createTextNode(t.substring(n,r.index)));let c=r[1].toLowerCase(),d=r[2].trim(),g=document.createElement("div");g.className=`alignment-${c}`,g.style.textAlign=c,g.style.margin="10px 0",this.renderImageSync(d,g),i.appendChild(g),n=r.index+r[0].length}}n===0&&i.childNodes.length===0||(n<t.length&&i.appendChild(document.createTextNode(t.substring(n))),e&&i.childNodes.length>0&&e.replaceChild(i,a))}renderImageSync(a,e){let t=/\[\[([^\]|]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp))(?:\|[^\]]+)?\]\]/gi,n=/!\[([^\]]*)\]\(([^)]+)\)/g,i,s=[];for(;(i=t.exec(a))!==null;){let r=i[1];s.push({src:r,alt:r})}for(;(i=n.exec(a))!==null;)s.push({alt:i[1],src:i[2]});for(let r of s){if(!Pe(r.src))continue;let o=document.createElement("img");if(o.alt=r.alt,r.src.startsWith("http"))o.src=r.src;else{let c=p(r.src);if(!z(c))continue;let d=this.plugin.app.vault.getAbstractFileByPath(c);if(d&&d instanceof ze.TFile)o.src=this.plugin.app.vault.getResourcePath(d);else{let g=this.findFileInVault(c);if(g)o.src=g;else continue}}o.style.maxWidth="100%",o.style.height="auto",e.appendChild(o)}}findFileInVault(a){let e=p(a),t=this.plugin.app.vault.getFiles();for(let n of t)if(n.name===e||n.path.endsWith(e))return this.plugin.app.vault.getResourcePath(n);return null}};var rt={ok:"\u786E\u5B9A",cancel:"\u53D6\u6D88",delete:"\u5220\u9664",restore:"\u6062\u590D",confirm:"\u786E\u8BA4",success:"\u6210\u529F",error:"\u9519\u8BEF",mediaLibrary:"\u5A92\u4F53\u5E93",unreferencedMedia:"\u672A\u5F15\u7528\u5A92\u4F53",trashManagement:"\u9694\u79BB\u6587\u4EF6\u7BA1\u7406",totalMediaFiles:"\u5171 {count} \u4E2A\u5A92\u4F53\u6587\u4EF6",noMediaFiles:"\u672A\u627E\u5230\u5A92\u4F53\u6587\u4EF6",allMediaTypesDisabled:"\u6240\u6709\u5A92\u4F53\u7C7B\u578B\u5DF2\u88AB\u7981\u7528\uFF0C\u8BF7\u5230\u8BBE\u7F6E\u4E2D\u542F\u7528\u81F3\u5C11\u4E00\u79CD\u5A92\u4F53\u7C7B\u578B",searchPlaceholder:"\u641C\u7D22\u6587\u4EF6\u540D...",searchResults:"\u627E\u5230 {count} \u4E2A\u7ED3\u679C",unreferencedFound:"\u627E\u5230 {count} \u4E2A\u672A\u5F15\u7528\u7684\u5A92\u4F53\u6587\u4EF6",allMediaReferenced:"\u592A\u68D2\u4E86\uFF01\u6240\u6709\u5A92\u4F53\u6587\u4EF6\u90FD\u5DF2\u88AB\u5F15\u7528",deleteToTrash:"\u6587\u4EF6\u5C06\u88AB\u79FB\u5165\u9694\u79BB\u6587\u4EF6\u5939",trashEmpty:"\u9694\u79BB\u6587\u4EF6\u5939\u4E3A\u7A7A",originalPath:"\u539F\u59CB\u4F4D\u7F6E",deletedAt:"\u5220\u9664\u65F6\u95F4",confirmClearAll:"\u786E\u5B9A\u8981\u6E05\u7A7A\u9694\u79BB\u6587\u4EF6\u5939\u5417\uFF1F",openInNotes:"\u5728\u7B14\u8BB0\u4E2D\u67E5\u627E",copyPath:"\u590D\u5236\u6587\u4EF6\u8DEF\u5F84",copyLink:"\u590D\u5236Markdown\u94FE\u63A5",openOriginal:"\u6253\u5F00\u539F\u59CB\u6587\u4EF6",preview:"\u9884\u89C8",shortcuts:"\u5FEB\u6377\u952E",openLibrary:"\u6253\u5F00\u5A92\u4F53\u5E93",findUnreferenced:"\u67E5\u627E\u672A\u5F15\u7528\u5A92\u4F53",openTrash:"\u6253\u5F00\u9694\u79BB\u6587\u4EF6\u7BA1\u7406",scanningReferences:"\u6B63\u5728\u626B\u63CF\u5F15\u7528",scanComplete:"\u626B\u63CF\u5B8C\u6210",filesScanned:"\u4E2A\u6587\u4EF6\u5DF2\u626B\u63CF",batchDeleteComplete:"\u5DF2\u5220\u9664 {count} \u4E2A\u6587\u4EF6",batchDeleteProgress:"\u6B63\u5728\u5220\u9664 {current}/{total}",batchRestoreComplete:"\u5DF2\u6062\u590D {count} \u4E2A\u6587\u4EF6",pluginSettings:"\u5A92\u4F53\u5DE5\u5177\u7BB1\u63D2\u4EF6\u8BBE\u7F6E",mediaFolder:"\u5A92\u4F53\u6587\u4EF6\u5939",mediaFolderDesc:"\u6307\u5B9A\u8981\u626B\u63CF\u7684\u5A92\u4F53\u6587\u4EF6\u5939\u8DEF\u5F84\uFF08\u7559\u7A7A\u5219\u626B\u63CF\u6574\u4E2A\u5E93\uFF09",thumbnailSize:"\u7F29\u7565\u56FE\u5927\u5C0F",thumbnailSizeDesc:"\u9009\u62E9\u5A92\u4F53\u5E93\u89C6\u56FE\u4E2D\u7F29\u7565\u56FE\u7684\u663E\u793A\u5927\u5C0F",thumbnailSmall:"\u5C0F (100px)",thumbnailMedium:"\u4E2D (150px)",thumbnailLarge:"\u5927 (200px)",defaultSortBy:"\u9ED8\u8BA4\u6392\u5E8F\u65B9\u5F0F",sortByDesc:"\u9009\u62E9\u56FE\u7247\u7684\u9ED8\u8BA4\u6392\u5E8F\u65B9\u5F0F",sortByName:"\u6309\u540D\u79F0",sortByDate:"\u6309\u4FEE\u6539\u65E5\u671F",sortBySize:"\u6309\u6587\u4EF6\u5927\u5C0F",sortOrder:"\u6392\u5E8F\u987A\u5E8F",sortOrderDesc:"\u9009\u62E9\u5347\u5E8F\u6216\u964D\u5E8F",sortAsc:"\u5347\u5E8F",sortDesc:"\u964D\u5E8F",showImageInfo:"\u663E\u793A\u56FE\u7247\u4FE1\u606F",showImageInfoDesc:"\u5728\u56FE\u7247\u7F29\u7565\u56FE\u4E0B\u65B9\u663E\u793A\u6587\u4EF6\u540D\u548C\u5927\u5C0F",autoRefresh:"\u81EA\u52A8\u5237\u65B0",autoRefreshDesc:"\u5F53\u5E93\u4E2D\u7684\u56FE\u7247\u53D1\u751F\u53D8\u5316\u65F6\u81EA\u52A8\u5237\u65B0\u89C6\u56FE",defaultAlignment:"\u9ED8\u8BA4\u56FE\u7247\u5BF9\u9F50\u65B9\u5F0F",alignmentDesc:"\u63D2\u5165\u56FE\u7247\u65F6\u7684\u9ED8\u8BA4\u5BF9\u9F50\u65B9\u5F0F",alignLeft:"\u5C45\u5DE6",alignCenter:"\u5C45\u4E2D",alignRight:"\u5C45\u53F3",safeDeleteSettings:"\u5B89\u5168\u5220\u9664\u8BBE\u7F6E",useTrashFolder:"\u4F7F\u7528\u9694\u79BB\u6587\u4EF6\u5939",useTrashFolderDesc:"\u5220\u9664\u6587\u4EF6\u65F6\u5148\u79FB\u5165\u9694\u79BB\u6587\u4EF6\u5939\uFF0C\u800C\u4E0D\u662F\u76F4\u63A5\u5220\u9664",trashFolderPath:"\u9694\u79BB\u6587\u4EF6\u5939",trashFolderPathDesc:"\u9694\u79BB\u6587\u4EF6\u5939\u7684\u8DEF\u5F84\uFF08\u76F8\u5BF9\u8DEF\u5F84\uFF09",autoCleanupTrash:"\u81EA\u52A8\u6E05\u7406\u9694\u79BB\u6587\u4EF6\u5939",autoCleanupTrashDesc:"\u81EA\u52A8\u6E05\u7406\u9694\u79BB\u6587\u4EF6\u5939\u4E2D\u7684\u65E7\u6587\u4EF6",autoCleanupComplete:"\u81EA\u52A8\u6E05\u7406\u5B8C\u6210\uFF0C\u5DF2\u5220\u9664 {count} \u4E2A\u6587\u4EF6",cleanupDays:"\u6E05\u7406\u5929\u6570",cleanupDaysDesc:"\u9694\u79BB\u6587\u4EF6\u5939\u4E2D\u7684\u6587\u4EF6\u8D85\u8FC7\u6B64\u5929\u6570\u540E\u5C06\u81EA\u52A8\u5220\u9664",mediaTypes:"\u5A92\u4F53\u7C7B\u578B",enableImageSupport:"\u542F\u7528\u56FE\u7247\u652F\u6301",enableImageSupportDesc:"\u5728\u5A92\u4F53\u5E93\u4E2D\u663E\u793A\u56FE\u7247\u6587\u4EF6 (png, jpg, gif, webp, svg, bmp)",enableVideoSupport:"\u542F\u7528\u89C6\u9891\u652F\u6301",enableVideoSupportDesc:"\u5728\u5A92\u4F53\u5E93\u4E2D\u663E\u793A\u89C6\u9891\u6587\u4EF6 (mp4, mov, avi, mkv, webm)",enableAudioSupport:"\u542F\u7528\u97F3\u9891\u652F\u6301",enableAudioSupportDesc:"\u5728\u5A92\u4F53\u5E93\u4E2D\u663E\u793A\u97F3\u9891\u6587\u4EF6 (mp3, wav, ogg, m4a, flac)",enablePDFSupport:"\u542F\u7528 PDF \u652F\u6301",enablePDFSupportDesc:"\u5728\u5A92\u4F53\u5E93\u4E2D\u663E\u793A PDF \u6587\u4EF6",viewSettings:"\u89C6\u56FE\u8BBE\u7F6E",interfaceLanguage:"\u754C\u9762\u8BED\u8A00",languageDesc:"\u9009\u62E9\u63D2\u4EF6\u754C\u9762\u663E\u793A\u7684\u8BED\u8A00",languageSystem:"\u8DDF\u968F\u7CFB\u7EDF",pageSize:"\u5206\u9875\u5927\u5C0F",pageSizeDesc:"\u5A92\u4F53\u5E93\u4E2D\u6BCF\u9875\u663E\u793A\u7684\u6587\u4EF6\u6570\u91CF",enablePreviewModal:"\u542F\u7528\u9884\u89C8 Modal",enablePreviewModalDesc:"\u70B9\u51FB\u5A92\u4F53\u6587\u4EF6\u65F6\u6253\u5F00\u9884\u89C8\u7A97\u53E3",enableKeyboardNav:"\u542F\u7528\u952E\u76D8\u5BFC\u822A",enableKeyboardNavDesc:"\u5728\u9884\u89C8\u7A97\u53E3\u4E2D\u4F7F\u7528\u65B9\u5411\u952E\u5207\u6362\u56FE\u7247",safeScanSettings:"\u5B89\u5168\u626B\u63CF",safeScanEnabledDesc:"\u542F\u7528\u540E\u53EF\u5728\u9694\u79BB\u6587\u4EF6\u7BA1\u7406\u4E2D\u6267\u884C\u6761\u4EF6\u626B\u63CF",safeScanUnrefDays:"\u672A\u5F15\u7528\u5929\u6570",safeScanUnrefDaysDesc:"\u4EC5\u626B\u63CF\u8D85\u8FC7\u6B64\u5929\u6570\u672A\u88AB\u5F15\u7528\u7684\u5A92\u4F53\u6587\u4EF6",safeScanMinSize:"\u6700\u5C0F\u6587\u4EF6\u5927\u5C0F (MB)",safeScanMinSizeDesc:"\u4EC5\u626B\u63CF\u5927\u4E8E\u7B49\u4E8E\u6B64\u5927\u5C0F\u7684\u5A92\u4F53\u6587\u4EF6",duplicateDetectionSettings:"\u91CD\u590D\u68C0\u6D4B",duplicateThresholdSetting:"\u76F8\u4F3C\u5EA6\u9608\u503C",duplicateThresholdDesc:"\u8FBE\u5230\u8BE5\u767E\u5206\u6BD4\u624D\u4F1A\u88AB\u5224\u5B9A\u4E3A\u91CD\u590D",keyboardShortcuts:"\u5FEB\u6377\u952E",shortcutsDesc:"\u63D2\u4EF6\u652F\u6301\u7684\u5FEB\u6377\u952E\uFF1A",shortcutOpenLibrary:"Ctrl+Shift+M - \u6253\u5F00\u5A92\u4F53\u5E93",shortcutFindUnreferenced:"Ctrl+Shift+U - \u67E5\u627E\u672A\u5F15\u7528\u5A92\u4F53",shortcutOpenTrash:"Ctrl+Shift+T - \u6253\u5F00\u9694\u79BB\u6587\u4EF6\u7BA1\u7406",commands:"\u5FEB\u6377\u547D\u4EE4",commandsDesc:"\u5728\u547D\u4EE4\u9762\u677F\u4E2D\u4F7F\u7528\u4EE5\u4E0B\u547D\u4EE4\uFF1A",cmdOpenLibrary:"\u5A92\u4F53\u5E93 - \u6253\u5F00\u5A92\u4F53\u5E93\u89C6\u56FE",cmdFindUnreferenced:"\u67E5\u627E\u672A\u5F15\u7528\u5A92\u4F53 - \u67E5\u627E\u672A\u88AB\u4EFB\u4F55\u7B14\u8BB0\u5F15\u7528\u7684\u5A92\u4F53\u6587\u4EF6",cmdTrashManagement:"\u9694\u79BB\u6587\u4EF6\u7BA1\u7406 - \u7BA1\u7406\u5DF2\u5220\u9664\u7684\u6587\u4EF6",cmdAlignLeft:"\u56FE\u7247\u5C45\u5DE6\u5BF9\u9F50 - \u5C06\u9009\u4E2D\u56FE\u7247\u5C45\u5DE6\u5BF9\u9F50",cmdAlignCenter:"\u56FE\u7247\u5C45\u4E2D\u5BF9\u9F50 - \u5C06\u9009\u4E2D\u56FE\u7247\u5C45\u4E2D\u5BF9\u9F50",cmdAlignRight:"\u56FE\u7247\u5C45\u53F3\u5BF9\u9F50 - \u5C06\u9009\u4E2D\u56FE\u7247\u5C45\u53F3\u5BF9\u9F50",loadingTrashFiles:"\u6B63\u5728\u52A0\u8F7D\u9694\u79BB\u6587\u4EF6...",trashFolderEmpty:"\u9694\u79BB\u6587\u4EF6\u5939\u4E3A\u7A7A",filesInTrash:"\u9694\u79BB\u6587\u4EF6\u5939\u4E2D\u6709 {count} \u4E2A\u6587\u4EF6",totalSize:"\u603B\u8BA1 {size}",trashManagementDesc:"\u5DF2\u5220\u9664\u7684\u6587\u4EF6\u4F1A\u4E34\u65F6\u5B58\u653E\u5728\u8FD9\u91CC\uFF0C\u60A8\u53EF\u4EE5\u6062\u590D\u6216\u5F7B\u5E95\u5220\u9664\u5B83\u4EEC",refresh:"\u5237\u65B0",clearTrash:"\u6E05\u7A7A\u9694\u79BB\u6587\u4EF6\u5939",clearTrashTooltip:"\u6E05\u7A7A\u9694\u79BB\u6587\u4EF6\u5939",restoreTooltip:"\u6062\u590D\u6587\u4EF6",permanentDelete:"\u5F7B\u5E95\u5220\u9664",permanentDeleteTooltip:"\u5F7B\u5E95\u5220\u9664",deletedTime:"\u5220\u9664\u65F6\u95F4",confirmDeleteFile:'\u786E\u5B9A\u8981\u5F7B\u5E95\u5220\u9664 "{name}" \u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002',confirmClearTrash:"\u786E\u5B9A\u8981\u6E05\u7A7A\u9694\u79BB\u6587\u4EF6\u5939\u5417\uFF1F{count} \u4E2A\u6587\u4EF6\u5C06\u88AB\u5F7B\u5E95\u5220\u9664\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002",fileDeleted:"\u5DF2\u5F7B\u5E95\u5220\u9664: {name}",restoreSuccess:"\u5DF2\u6062\u590D: {name}",restoreFailed:"\u6062\u590D\u5931\u8D25: {message}",targetFileExists:"\u76EE\u6807\u6587\u4EF6\u5DF2\u5B58\u5728",deleteFailed:"\u5220\u9664\u5931\u8D25",fileNameCopied:"\u6587\u4EF6\u540D\u5DF2\u590D\u5236",originalPathCopied:"\u539F\u59CB\u8DEF\u5F84\u5DF2\u590D\u5236",scanningUnreferenced:"\u6B63\u5728\u626B\u63CF\u672A\u5F15\u7528\u7684\u5A92\u4F53\u6587\u4EF6...",totalSizeLabel:"\u603B\u8BA1 {size}",scanError:"\u626B\u63CF\u56FE\u7247\u65F6\u51FA\u9519",unreferencedDesc:"\u4EE5\u4E0B\u5A92\u4F53\u6587\u4EF6\u672A\u88AB\u4EFB\u4F55\u7B14\u8BB0\u5F15\u7528\uFF0C\u53EF\u80FD\u53EF\u4EE5\u5220\u9664\u4EE5\u91CA\u653E\u7A7A\u95F4",noFilesToDelete:"\u6CA1\u6709\u9700\u8981\u5220\u9664\u7684\u56FE\u7247",processedFiles:"\u5DF2\u5904\u7406 {count} \u4E2A\u6587\u4EF6",processedFilesError:"\u5904\u7406 {errors} \u4E2A\u6587\u4EF6\u65F6\u51FA\u9519",copyAllPaths:"\u590D\u5236\u6240\u6709\u8DEF\u5F84",copiedFilePaths:"\u5DF2\u590D\u5236 {count} \u4E2A\u6587\u4EF6\u8DEF\u5F84",noMatchingFiles:"\u6CA1\u6709\u5339\u914D\u7684\u6587\u4EF6",prevPage:"\u4E0A\u4E00\u9875",nextPage:"\u4E0B\u4E00\u9875",pageInfo:"\u7B2C {current} / {total} \u9875",selectFiles:"\u5DF2\u9009\u62E9 {count} \u4E2A\u6587\u4EF6",selectAll:"\u5168\u9009",deselectAll:"\u53D6\u6D88\u5168\u9009",confirmDeleteSelected:"\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 {count} \u4E2A\u6587\u4EF6\u5417\uFF1F",deletedFiles:"\u5DF2\u5220\u9664 {count} \u4E2A\u6587\u4EF6",deleteFilesFailed:"\u5220\u9664 {count} \u4E2A\u6587\u4EF6\u5931\u8D25",multiSelectMode:"\u591A\u9009\u6A21\u5F0F",unsupportedFileType:"\u4E0D\u652F\u6301\u9884\u89C8\u6B64\u7C7B\u578B\u6587\u4EF6",copyPathBtn:"\u590D\u5236\u8DEF\u5F84",copyLinkBtn:"\u590D\u5236\u94FE\u63A5",findInNotes:"\u5728\u7B14\u8BB0\u4E2D\u67E5\u627E",pathCopied:"\u8DEF\u5F84\u5DF2\u590D\u5236",linkCopied:"\u94FE\u63A5\u5DF2\u590D\u5236",imageLoadError:"\u56FE\u7247\u52A0\u8F7D\u5931\u8D25",alignImageLeft:"\u56FE\u7247\u5C45\u5DE6\u5BF9\u9F50",alignImageCenter:"\u56FE\u7247\u5C45\u4E2D\u5BF9\u9F50",alignImageRight:"\u56FE\u7247\u5C45\u53F3\u5BF9\u9F50",selectImageFirst:"\u8BF7\u5148\u9009\u4E2D\u4E00\u5F20\u56FE\u7247",selectImage:"\u8BF7\u9009\u4E2D\u56FE\u7247",imageAlignedLeft:"\u56FE\u7247\u5DF2\u5C45\u5DE6\u5BF9\u9F50",imageAlignedCenter:"\u56FE\u7247\u5DF2\u5C45\u4E2D\u5BF9\u9F50",imageAlignedRight:"\u56FE\u7247\u5DF2\u5C45\u53F3\u5BF9\u9F50",copiedFileName:"\u5DF2\u590D\u5236\u6587\u4EF6\u540D",copiedOriginalPath:"\u5DF2\u590D\u5236\u539F\u59CB\u8DEF\u5F84",notReferenced:"\u8BE5\u56FE\u7247\u672A\u88AB\u4EFB\u4F55\u7B14\u8BB0\u5F15\u7528",movedToTrash:"\u5DF2\u79FB\u81F3\u9694\u79BB\u6587\u4EF6\u5939: {name}",deletedFile:"\u5DF2\u5220\u9664: {name}",restoredFile:"\u5DF2\u6062\u590D\u6587\u4EF6",cmdImageLibrary:"\u56FE\u7247\u5E93",cmdFindUnreferencedImages:"\u67E5\u627E\u672A\u5F15\u7528\u56FE\u7247",cmdRefreshCache:"\u5237\u65B0\u5A92\u4F53\u5F15\u7528\u7F13\u5B58",cmdAlignImageLeft:"\u56FE\u7247\u5C45\u5DE6\u5BF9\u9F50",cmdAlignImageCenter:"\u56FE\u7247\u5C45\u4E2D\u5BF9\u9F50",cmdAlignImageRight:"\u56FE\u7247\u5C45\u53F3\u5BF9\u9F50",cmdOpenMediaLibrary:"\u6253\u5F00\u5A92\u4F53\u5E93",cmdFindUnreferencedMedia:"\u67E5\u627E\u672A\u5F15\u7528\u5A92\u4F53",cmdOpenTrashManagement:"\u6253\u5F00\u9694\u79BB\u6587\u4EF6\u7BA1\u7406",deleteFailedWithName:"\u5220\u9664\u5931\u8D25: {name}",deletedWithQuarantineFailed:"\u5DF2\u5220\u9664: {name}\uFF08\u9694\u79BB\u5931\u8D25\uFF09",operationFailed:"\u64CD\u4F5C\u5931\u8D25: {name}",processing:"\u5904\u7406\u4E2D...",duplicateDetection:"\u91CD\u590D\u68C0\u6D4B",duplicateDetectionDesc:"\u4F7F\u7528\u611F\u77E5\u54C8\u5E0C\u7B97\u6CD5\u68C0\u6D4B\u50CF\u7D20\u7EA7\u91CD\u590D\u56FE\u7247\uFF0C\u975E\u6587\u4EF6\u540D\u5BF9\u6BD4",noDuplicatesFound:"\u672A\u53D1\u73B0\u91CD\u590D\u6587\u4EF6\uFF0C\u70B9\u51FB\u201C\u5F00\u59CB\u626B\u63CF\u201D\u68C0\u6D4B",startScan:"\u5F00\u59CB\u626B\u63CF",scanProgress:"\u626B\u63CF\u8FDB\u5EA6: {current}/{total}",similarityThreshold:"\u76F8\u4F3C\u5EA6\u9608\u503C: {value}%",duplicateGroupsFound:"\u53D1\u73B0 {groups} \u7EC4\u91CD\u590D\uFF0C\u5171 {files} \u4E2A\u5197\u4F59\u6587\u4EF6",duplicateGroup:"\u91CD\u590D\u7EC4 #{index}",files:"\u4E2A\u6587\u4EF6",suggestKeep:"\u2705 \u5EFA\u8BAE\u4FDD\u7559",quarantine:"\u9694\u79BB",quarantineAllDuplicates:"\u4E00\u952E\u9694\u79BB\u6240\u6709\u91CD\u590D",duplicatesFound:"\u53D1\u73B0 {groups} \u7EC4\u91CD\u590D\uFF0C\u5171 {files} \u4E2A\u5197\u4F59\u6587\u4EF6",duplicatesQuarantined:"\u5DF2\u9694\u79BB {count} \u4E2A\u91CD\u590D\u6587\u4EF6",typeDistribution:"\u7C7B\u578B\u5206\u5E03",unreferencedRate:"\u672A\u5F15\u7528\u7387",referencedBy:"\u88AB {count} \u7BC7\u7B14\u8BB0\u5F15\u7528",selectedCount:"\u5DF2\u9009\u62E9 {count} \u9879",batchRestore:"\u6279\u91CF\u6062\u590D",batchDelete:"\u6279\u91CF\u5220\u9664",noItemsSelected:"\u8BF7\u5148\u9009\u62E9\u6587\u4EF6",confirmBatchRestore:"\u786E\u8BA4\u6062\u590D {count} \u4E2A\u6587\u4EF6\uFF1F",batchRestoreCompleted:"\u5DF2\u6062\u590D {count} \u4E2A\u6587\u4EF6",safeScan:"\u5B89\u5168\u626B\u63CF",safeScanDesc:"\u81EA\u52A8\u626B\u63CF\u672A\u5F15\u7528\u3001\u8D85\u671F\u3001\u8D85\u5927\u7684\u5A92\u4F53\u6587\u4EF6",safeScanStarted:"\u5F00\u59CB\u5B89\u5168\u626B\u63CF...",safeScanNoResults:"\u672A\u53D1\u73B0\u7B26\u5408\u6761\u4EF6\u7684\u6587\u4EF6",safeScanConfirm:"\u53D1\u73B0 {count} \u4E2A\u6587\u4EF6\u7B26\u5408\u6761\u4EF6\uFF08\u672A\u5F15\u7528>{days}\u5929 + \u5927\u5C0F>{size}\uFF09\uFF0C\u786E\u8BA4\u9001\u5165\u9694\u79BB\u533A\uFF1F",safeScanComplete:"\u5B89\u5168\u626B\u63CF\u5B8C\u6210\uFF0C\u5DF2\u9694\u79BB {count} \u4E2A\u6587\u4EF6",safeScanFailed:"\u5B89\u5168\u626B\u63CF\u5931\u8D25",cmdDuplicateDetection:"\u6253\u5F00\u91CD\u590D\u68C0\u6D4B",organizing:"\u6574\u7406\u4E2D",organizeComplete:"\u5DF2\u6574\u7406 {count} \u4E2A\u6587\u4EF6"},ot={ok:"OK",cancel:"Cancel",delete:"Delete",restore:"Restore",confirm:"Confirm",success:"Success",error:"Error",mediaLibrary:"Media Library",unreferencedMedia:"Unreferenced Media",trashManagement:"Trash Management",totalMediaFiles:"{count} media files",noMediaFiles:"No media files found",allMediaTypesDisabled:"All media types have been disabled. Please enable at least one media type in settings",searchPlaceholder:"Search by filename...",searchResults:"{count} results found",unreferencedFound:"{count} unreferenced media files found",allMediaReferenced:"Great! All media files are referenced",deleteToTrash:"Files will be moved to trash folder",trashEmpty:"Trash folder is empty",originalPath:"Original location",deletedAt:"Deleted at",confirmClearAll:"Are you sure you want to empty the trash folder?",openInNotes:"Find in Notes",copyPath:"Copy Path",copyLink:"Copy Link",openOriginal:"Open Original",preview:"Preview",shortcuts:"Shortcuts",openLibrary:"Open Media Library",findUnreferenced:"Find Unreferenced Media",openTrash:"Open Trash Management",scanningReferences:"Scanning references",scanComplete:"Scan complete",filesScanned:"files scanned",batchDeleteComplete:"{count} files deleted",batchDeleteProgress:"Deleting {current}/{total}",batchRestoreComplete:"{count} files restored",pluginSettings:"Media Toolkit Plugin Settings",mediaFolder:"Media Folder",mediaFolderDesc:"Specify the media folder path to scan (leave empty to scan entire vault)",thumbnailSize:"Thumbnail Size",thumbnailSizeDesc:"Choose thumbnail size in media library view",thumbnailSmall:"Small (100px)",thumbnailMedium:"Medium (150px)",thumbnailLarge:"Large (200px)",defaultSortBy:"Default Sort By",sortByDesc:"Choose default sort method for images",sortOrder:"Sort Order",sortOrderDesc:"Choose ascending or descending order",sortByName:"By Name",sortByDate:"By Date",sortBySize:"By Size",sortAsc:"Ascending",sortDesc:"Descending",showImageInfo:"Show Image Info",showImageInfoDesc:"Display filename and size below image thumbnails",autoRefresh:"Auto Refresh",autoRefreshDesc:"Automatically refresh view when images change in vault",defaultAlignment:"Default Image Alignment",alignmentDesc:"Default alignment when inserting images",alignLeft:"Left",alignCenter:"Center",alignRight:"Right",safeDeleteSettings:"Safe Delete Settings",useTrashFolder:"Use Trash Folder",useTrashFolderDesc:"Move files to trash folder instead of deleting directly",trashFolderPath:"Trash Folder",trashFolderPathDesc:"Path to trash folder (relative path)",autoCleanupTrash:"Auto Cleanup Trash",autoCleanupTrashDesc:"Automatically clean up old files in trash folder",autoCleanupComplete:"Auto cleanup complete, deleted {count} files",cleanupDays:"Cleanup Days",cleanupDaysDesc:"Files older than this many days will be automatically deleted",mediaTypes:"Media Types",enableImageSupport:"Enable Image Support",enableImageSupportDesc:"Show image files in media library (png, jpg, gif, webp, svg, bmp)",enableVideoSupport:"Enable Video Support",enableVideoSupportDesc:"Show video files in media library (mp4, mov, avi, mkv, webm)",enableAudioSupport:"Enable Audio Support",enableAudioSupportDesc:"Show audio files in media library (mp3, wav, ogg, m4a, flac)",enablePDFSupport:"Enable PDF Support",enablePDFSupportDesc:"Show PDF files in media library",viewSettings:"View Settings",interfaceLanguage:"Interface Language",languageDesc:"Choose language for plugin interface",languageSystem:"Follow System",pageSize:"Page Size",pageSizeDesc:"Number of files per page in media library",enablePreviewModal:"Enable Preview Modal",enablePreviewModalDesc:"Open preview window when clicking media files",enableKeyboardNav:"Enable Keyboard Navigation",enableKeyboardNavDesc:"Use arrow keys to navigate in preview window",safeScanSettings:"Safe Scan",safeScanEnabledDesc:"Enable conditional scanning from trash management view",safeScanUnrefDays:"Unreferenced Days",safeScanUnrefDaysDesc:"Only scan media files unreferenced for at least this many days",safeScanMinSize:"Minimum File Size (MB)",safeScanMinSizeDesc:"Only scan media files at or above this size",duplicateDetectionSettings:"Duplicate Detection",duplicateThresholdSetting:"Similarity Threshold",duplicateThresholdDesc:"Only groups at or above this percentage are treated as duplicates",keyboardShortcuts:"Keyboard Shortcuts",shortcutsDesc:"Plugin keyboard shortcuts:",shortcutOpenLibrary:"Ctrl+Shift+M - Open Media Library",shortcutFindUnreferenced:"Ctrl+Shift+U - Find Unreferenced Media",shortcutOpenTrash:"Ctrl+Shift+T - Open Trash Management",commands:"Commands",commandsDesc:"Use these commands in command palette:",cmdOpenLibrary:"Media Library - Open media library view",cmdFindUnreferenced:"Find Unreferenced Media - Find media files not referenced by any notes",cmdTrashManagement:"Trash Management - Manage deleted files",cmdAlignLeft:"Align Image Left - Align selected image to left",cmdAlignCenter:"Align Image Center - Center align selected image",cmdAlignRight:"Align Image Right - Align selected image to right",loadingTrashFiles:"Loading trash files...",trashFolderEmpty:"Trash folder is empty",filesInTrash:"{count} files in trash folder",totalSize:"Total: {size}",trashManagementDesc:"Deleted files are temporarily stored here. You can restore or permanently delete them.",refresh:"Refresh",clearTrash:"Empty Trash",clearTrashTooltip:"Empty trash folder",restoreTooltip:"Restore file",permanentDelete:"Delete",permanentDeleteTooltip:"Permanently delete",deletedTime:"Deleted at",confirmDeleteFile:'Are you sure you want to permanently delete "{name}"? This cannot be undone.',confirmClearTrash:"Are you sure you want to empty the trash folder? {count} files will be permanently deleted. This cannot be undone.",fileDeleted:"Permanently deleted: {name}",restoreSuccess:"Restored: {name}",restoreFailed:"Restore failed: {message}",targetFileExists:"Target file already exists",deleteFailed:"Delete failed",fileNameCopied:"File name copied",originalPathCopied:"Original path copied",scanningUnreferenced:"Scanning unreferenced media files...",totalSizeLabel:"Total: {size}",scanError:"Error scanning images",unreferencedDesc:"These media files are not referenced by any notes and can be deleted to free up space",noFilesToDelete:"No files to delete",processedFiles:"Processed {count} files",processedFilesError:"Error processing {errors} files",copyAllPaths:"Copy all paths",copiedFilePaths:"Copied {count} file paths",noMatchingFiles:"No matching files",prevPage:"Previous",nextPage:"Next",pageInfo:"Page {current} / {total}",selectFiles:"{count} files selected",selectAll:"Select All",deselectAll:"Deselect All",confirmDeleteSelected:"Are you sure you want to delete {count} selected files?",deletedFiles:"{count} files deleted",deleteFilesFailed:"Failed to delete {count} files",multiSelectMode:"Multi-select mode",unsupportedFileType:"Preview not supported for this file type",copyPathBtn:"Copy Path",copyLinkBtn:"Copy Link",findInNotes:"Find in Notes",pathCopied:"Path copied",linkCopied:"Link copied",imageLoadError:"Image failed to load",alignImageLeft:"Align Image Left",alignImageCenter:"Align Image Center",alignImageRight:"Align Image Right",selectImageFirst:"Please select an image first",selectImage:"Please select an image",imageAlignedLeft:"Image aligned to left",imageAlignedCenter:"Image centered",imageAlignedRight:"Image aligned to right",copiedFileName:"File name copied",copiedOriginalPath:"Original path copied",notReferenced:"This image is not referenced by any notes",movedToTrash:"Moved to trash folder: {name}",deletedFile:"Deleted: {name}",restoredFile:"File restored",cmdImageLibrary:"Image Library",cmdFindUnreferencedImages:"Find Unreferenced Images",cmdRefreshCache:"Refresh Media Reference Cache",cmdAlignImageLeft:"Align Image Left",cmdAlignImageCenter:"Align Image Center",cmdAlignImageRight:"Align Image Right",cmdOpenMediaLibrary:"Open Media Library",cmdFindUnreferencedMedia:"Find Unreferenced Media",cmdOpenTrashManagement:"Open Trash Management",deleteFailedWithName:"Delete failed: {name}",deletedWithQuarantineFailed:"Deleted: {name} (quarantine failed)",operationFailed:"Operation failed: {name}",processing:"Processing...",duplicateDetection:"Duplicate Detection",duplicateDetectionDesc:"Detect pixel-level duplicate images using perceptual hashing algorithm",noDuplicatesFound:'No duplicates found. Click "Start Scan" to detect.',startScan:"Start Scan",scanProgress:"Scanning: {current}/{total}",similarityThreshold:"Similarity threshold: {value}%",duplicateGroupsFound:"Found {groups} group(s), {files} redundant file(s)",duplicateGroup:"Group #{index}",files:"files",suggestKeep:"\u2705 Keep",quarantine:"Quarantine",quarantineAllDuplicates:"Quarantine All Duplicates",duplicatesFound:"Found {groups} group(s), {files} redundant file(s)",duplicatesQuarantined:"Quarantined {count} duplicate file(s)",typeDistribution:"Type Distribution",unreferencedRate:"Unreferenced Rate",referencedBy:"Referenced by {count} note(s)",selectedCount:"{count} selected",batchRestore:"Batch Restore",batchDelete:"Batch Delete",noItemsSelected:"Please select files first",confirmBatchRestore:"Restore {count} file(s)?",batchRestoreCompleted:"Restored {count} file(s)",safeScan:"Safe Scan",safeScanDesc:"Auto-detect unreferenced, old, and large media files",safeScanStarted:"Starting safe scan...",safeScanNoResults:"No files match the criteria",safeScanConfirm:"Found {count} file(s) matching criteria (unreferenced >{days} days + size >{size}). Send to quarantine?",safeScanComplete:"Safe scan complete, quarantined {count} file(s)",safeScanFailed:"Safe scan failed",cmdDuplicateDetection:"Open Duplicate Detection",organizing:"Organizing",organizeComplete:"Organized {count} file(s)"},he={zh:rt,en:ot};function Re(l,a,e){let t=(he[l]??he.zh)[a]||he.zh[a]||a;return e&&Object.entries(e).forEach(([n,i])=>{t=t.split(`{${n}}`).join(String(i))}),t}function Oe(){let l=typeof navigator<"u"?navigator.language:null;return(l?l.toLowerCase():"zh").startsWith("zh")?"zh":"en"}var Ne=require("obsidian");var Y=class{constructor(a,e=null){this.index=new Map;this.listeners=[];this.enabledExtensions=new Set;this.trashFolder="";this.initialized=!1;this.vault=a,this.thumbnailCache=e}setEnabledExtensions(a){this.enabledExtensions=new Set(a.map(e=>e.toLowerCase()))}setTrashFolder(a){this.trashFolder=a}isInTrashFolder(a){return this.trashFolder?a.startsWith(this.trashFolder+"/")||a===this.trashFolder:!1}shouldIndex(a){if(!(a instanceof Ne.TFile)||this.isInTrashFolder(a.path))return!1;let e="."+a.extension.toLowerCase();return this.enabledExtensions.size>0?this.enabledExtensions.has(e):G(a.name)}toEntry(a){return{path:a.path,name:a.name,size:a.stat.size,mtime:a.stat.mtime,extension:a.extension.toLowerCase()}}async fullScan(){this.index.clear();let a=this.vault.getFiles();for(let e of a)this.shouldIndex(e)&&this.index.set(e.path,this.toEntry(e));this.initialized=!0}onFileCreated(a){if(!this.shouldIndex(a))return;let e=this.toEntry(a);this.index.set(e.path,e),this.notifyListeners("create",e)}onFileModified(a){if(!this.shouldIndex(a))return;let e=this.toEntry(a);this.index.set(e.path,e),this.notifyListeners("modify",e)}onFileDeleted(a){let e=a.path,t=this.index.get(e);t&&(this.index.delete(e),this.thumbnailCache&&this.thumbnailCache.delete(e),this.notifyListeners("delete",t))}onFileRenamed(a,e){let t=this.index.get(e);if(t&&this.index.delete(e),this.shouldIndex(a)){let n=this.toEntry(a);this.index.set(n.path,n),this.thumbnailCache&&this.thumbnailCache.rename(e,n.path),this.notifyListeners("rename",n,e)}else t&&(this.thumbnailCache&&this.thumbnailCache.delete(e),this.notifyListeners("delete",t))}getFiles(){return Array.from(this.index.values())}get size(){return this.index.size}get isInitialized(){return this.initialized}getEntry(a){return this.index.get(a)}onChange(a){this.listeners.push(a)}offChange(a){let e=this.listeners.indexOf(a);e>=0&&this.listeners.splice(e,1)}notifyListeners(a,e,t){for(let n of this.listeners)try{n(a,e,t)}catch(i){console.error("MediaFileIndex listener error:",i)}}clear(){this.index.clear(),this.initialized=!1}};var j=class j extends y.Plugin{constructor(){super(...arguments);this.settings=b;this.referencedImagesCache=null;this.cacheTimestamp=0;this.refreshViewsTimer=null;this.thumbnailCache=new J;this.fileIndex=new Y(null);this.indexedExtensionsKey="";this.indexedTrashFolder=""}getCurrentLanguage(){return this.settings.language==="system"?Oe():this.settings.language}t(e,t){return Re(this.getCurrentLanguage(),e,t)}async onload(){await this.loadSettings(),await this.migrateLegacyTrashFolder(),await this.initPerformanceInfra(),this.addStyle(),this.registerView(B,t=>new W(t,this)),this.registerView(V,t=>new K(t,this)),this.registerView(U,t=>new Q(t,this)),this.registerView(H,t=>new te(t,this)),new ae(this).register(),this.addCommand({id:"open-image-library",name:this.t("cmdImageLibrary"),checkCallback:t=>{if(t)return!0;this.openImageLibrary()}}),this.addCommand({id:"find-unreferenced-images",name:this.t("cmdFindUnreferencedImages"),checkCallback:t=>{if(t)return!0;this.findUnreferencedImages()}}),this.addCommand({id:"refresh-cache",name:this.t("cmdRefreshCache"),checkCallback:t=>{if(t)return!0;this.refreshCache()}}),this.addCommand({id:"open-duplicate-detection",name:this.t("cmdDuplicateDetection"),checkCallback:t=>{if(t)return!0;this.openDuplicateDetection()}}),this.addCommand({id:"open-trash-management",name:this.t("cmdTrashManagement"),checkCallback:t=>{if(t)return!0;this.openTrashManagement()}}),this.addCommand({id:"align-image-left",name:this.t("cmdAlignImageLeft"),editorCallback:t=>{this.alignSelectedImage(t,"left")}}),this.addCommand({id:"align-image-center",name:this.t("cmdAlignImageCenter"),editorCallback:t=>{this.alignSelectedImage(t,"center")}}),this.addCommand({id:"align-image-right",name:this.t("cmdAlignImageRight"),editorCallback:t=>{this.alignSelectedImage(t,"right")}}),this.registerEvent(this.app.workspace.on("editor-context-menu",(t,n)=>{this.addAlignmentMenuItems(t,n)})),this.addSettingTab(new ie(this.app,this)),this.registerKeyboardShortcuts(),this.registerVaultEventListeners(),this.autoCleanupTrashOnStartup()}async migrateLegacyTrashFolder(){let e=p(j.LEGACY_TRASH_FOLDER),t=p(b.trashFolder)||b.trashFolder,n=p(this.settings.trashFolder)||t,i=!1;n===e&&(this.settings.trashFolder=t,i=!0);try{let s=this.app.vault.adapter;await s.exists(e)&&(await s.exists(t)||await s.rename(e,t))}catch(s){console.error("\u8FC1\u79FB\u65E7\u7248\u9694\u79BB\u76EE\u5F55\u5931\u8D25:",s)}i&&await this.saveData(this.settings)}async autoCleanupTrashOnStartup(){if(this.settings.autoCleanupTrash)try{await this.cleanupOldTrashFiles()}catch(e){console.error("\u81EA\u52A8\u6E05\u7406\u9694\u79BB\u6587\u4EF6\u5939\u5931\u8D25:",e)}}async cleanupOldTrashFiles(){let{vault:e}=this.app,t=p(this.settings.trashFolder);if(!t||!z(t))return 0;let n=e.getAbstractFileByPath(t);if(!n||!(n instanceof y.TFolder))return 0;let i=Math.max(1,this.settings.trashCleanupDays||30),s=Date.now()-i*24*60*60*1e3,r=0,o=n.children;for(let c of o)if(c instanceof y.TFile&&c.stat.mtime<s)try{await e.delete(c),r++}catch(d){console.error(`\u5220\u9664\u9694\u79BB\u6587\u4EF6\u5931\u8D25: ${c.name}`,d)}return r>0&&new y.Notice(this.t("autoCleanupComplete").replace("{count}",String(r))),r}registerKeyboardShortcuts(){this.addCommand({id:"open-media-library-shortcut",name:this.t("cmdOpenMediaLibrary"),hotkeys:[{modifiers:["Ctrl","Shift"],key:"m"}],callback:()=>{this.openImageLibrary()}}),this.addCommand({id:"find-unreferenced-media-shortcut",name:this.t("cmdFindUnreferencedMedia"),hotkeys:[{modifiers:["Ctrl","Shift"],key:"u"}],callback:()=>{this.findUnreferencedImages()}}),this.addCommand({id:"open-trash-management-shortcut",name:this.t("cmdOpenTrashManagement"),hotkeys:[{modifiers:["Ctrl","Shift"],key:"t"}],callback:()=>{this.openTrashManagement()}})}registerVaultEventListeners(){this.registerEvent(this.app.vault.on("create",e=>{this.fileIndex.onFileCreated(e),this.handleVaultFileChange(e)})),this.registerEvent(this.app.vault.on("delete",e=>{this.fileIndex.onFileDeleted(e),this.handleVaultFileChange(e)})),this.registerEvent(this.app.vault.on("modify",e=>{this.fileIndex.onFileModified(e),this.handleVaultFileChange(e)})),this.registerEvent(this.app.vault.on("rename",(e,t)=>{this.fileIndex.onFileRenamed(e,t),this.handleVaultFileChange(e,t)}))}async initPerformanceInfra(){await this.thumbnailCache.open(),this.fileIndex=new Y(this.app.vault,this.thumbnailCache),await this.syncPerformanceInfraSettings(!0)}async syncPerformanceInfraSettings(e=!1){let t=Z(this.settings),n=p(this.settings.trashFolder)||b.trashFolder,i=[...t].sort().join("|"),s=e||!this.fileIndex.isInitialized||this.indexedExtensionsKey!==i||this.indexedTrashFolder!==n;this.fileIndex.setEnabledExtensions(t),this.fileIndex.setTrashFolder(n),this.indexedExtensionsKey=i,this.indexedTrashFolder=n,s&&await this.fileIndex.fullScan()}handleVaultFileChange(e,t){if(e instanceof y.TFolder){this.clearCache(),this.settings.autoRefresh&&this.scheduleRefreshOpenViews();return}if(!(e instanceof y.TFile))return;let n=p(t||"").toLowerCase(),i=n.endsWith(".md"),s=n?G(n):!1,r=e.extension==="md",o=G(e.name);(r||i)&&this.clearCache(),!(!o&&!s)&&(r||i||this.clearCache(),this.settings.autoRefresh&&this.scheduleRefreshOpenViews())}scheduleRefreshOpenViews(e=300){this.refreshViewsTimer&&clearTimeout(this.refreshViewsTimer),this.refreshViewsTimer=setTimeout(()=>{this.refreshViewsTimer=null,this.refreshOpenViews()},e)}async refreshOpenViews(){let e=[];for(let t of this.app.workspace.getLeavesOfType(B)){let n=t.view;n instanceof W&&e.push(n.refreshImages())}for(let t of this.app.workspace.getLeavesOfType(V)){let n=t.view;n instanceof K&&e.push(n.scanUnreferencedImages())}for(let t of this.app.workspace.getLeavesOfType(U)){let n=t.view;n instanceof Q&&e.push(n.loadTrashItems())}e.length>0&&await Promise.allSettled(e)}async openTrashManagement(){let{workspace:e}=this.app,t=e.getLeavesOfType(U)[0];t||(t=e.getLeaf("tab"),await t.setViewState({type:U,active:!0})),e.revealLeaf(t)}openMediaPreview(e){if(!this.settings.enablePreviewModal){let t=this.app.vault.getResourcePath(e);window.open(t,"_blank","noopener,noreferrer");return}new ne(this.app,this,e).open()}onunload(){this.refreshViewsTimer&&(clearTimeout(this.refreshViewsTimer),this.refreshViewsTimer=null),this.thumbnailCache.close(),this.fileIndex.clear(),this.app.workspace.detachLeavesOfType(B),this.app.workspace.detachLeavesOfType(V),this.app.workspace.detachLeavesOfType(U),this.app.workspace.detachLeavesOfType(H)}async openDuplicateDetection(){let{workspace:e}=this.app,t=e.getLeavesOfType(H)[0];t||(t=e.getLeaf("tab"),await t.setViewState({type:H,active:!0})),e.revealLeaf(t)}addStyle(){this.loadExternalStyles(),this.addInlineStyle()}async loadExternalStyles(){if(!document.getElementById("obsidian-media-toolkit-styles"))try{let e=this.app.vault.getAbstractFileByPath("styles.css");if(e&&e instanceof y.TFile){let n=(await this.app.vault.read(e)).replace(/expression\s*\(/gi,"/* blocked */(").replace(/javascript\s*:/gi,"/* blocked */:").replace(/vbscript\s*:/gi,"/* blocked */:").replace(/url\s*\([^)]*\)/gi,"/* url() blocked */").replace(/@import\s*[^;]+;/gi,"/* @import blocked */").replace(/\bon(click|error|load|mouseover|mouseout|focus|blur|change|submit|keydown|keyup)\s*=/gi,"data-blocked-on$1=").replace(/filter\s*:\s*url\s*\([^)]*\)/gi,"/* filter:url() blocked */").replace(/behavior\s*:/gi,"/* behavior blocked */:").replace(/-ms-behavior\s*:/gi,"/* -ms-behavior blocked */:").replace(/binding\s*:\s*url\s*\([^)]*\)/gi,"/* binding blocked */").replace(/(animation|transition)\s*:[^;]*url\s*\([^)]*\)/gi,"/* $1 url() blocked */"),i=document.createElement("style");i.id="obsidian-media-toolkit-styles",i.textContent=n,document.head.appendChild(i)}}catch(e){console.log("\u52A0\u8F7D\u5916\u90E8\u6837\u5F0F\u6587\u4EF6\u5931\u8D25\uFF0C\u4F7F\u7528\u5185\u8054\u6837\u5F0F",e)}}addInlineStyle(){if(document.getElementById("image-manager-styles"))return;let e=document.createElement("style");e.id="image-manager-styles",e.textContent=`/* Obsidian Image Manager Plugin Styles */

/* ===== \u5168\u5C40\u6837\u5F0F ===== */
.image-library-view,
.unreferenced-images-view {
	height: 100%;
	overflow-y: auto;
	padding: 16px;
	box-sizing: border-box;
}

/* ===== \u5934\u90E8\u6837\u5F0F ===== */
.image-library-header,
.unreferenced-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20px;
	padding-bottom: 16px;
	border-bottom: 1px solid var(--background-modifier-border);
}

.image-library-header h2,
.unreferenced-header h2 {
	margin: 0;
	font-size: 1.5em;
	font-weight: 600;
}

.image-stats,
.header-description {
	margin-top: 4px;
	color: var(--text-muted);
	font-size: 0.9em;
}

.header-description {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

/* ===== \u6309\u94AE\u6837\u5F0F ===== */
.refresh-button,
.action-button,
.item-button {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px;
	border: none;
	background: var(--background-secondary);
	color: var(--text-normal);
	border-radius: 4px;
	cursor: pointer;
	transition: background 0.2s, color 0.2s;
}

.refresh-button:hover,
.action-button:hover,
.item-button:hover {
	background: var(--background-tertiary);
}

.refresh-button svg,
.action-button svg,
.item-button svg {
	width: 16px;
	height: 16px;
}

.action-button.danger,
.item-button.danger {
	color: var(--text-error);
}

.action-button.danger:hover,
.item-button.danger:hover {
	background: var(--background-modifier-error);
	color: white;
}

.header-actions {
	display: flex;
	gap: 8px;
}

/* ===== \u6392\u5E8F\u9009\u62E9\u5668 ===== */
.sort-select {
	padding: 6px 12px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: var(--background-secondary);
	color: var(--text-normal);
	font-size: 0.9em;
	cursor: pointer;
}

.order-button {
	padding: 6px 8px;
	margin-left: 8px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: var(--background-secondary);
	color: var(--text-normal);
	cursor: pointer;
}

.order-button svg {
	width: 16px;
	height: 16px;
}

/* ===== \u56FE\u7247\u7F51\u683C ===== */
.image-grid {
	display: grid;
	gap: 16px;
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.image-grid-small {
	grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
}

.image-grid-medium {
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.image-grid-large {
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

/* ===== \u56FE\u7247\u9879 ===== */
.image-item {
	display: flex;
	flex-direction: column;
	background: var(--background-secondary);
	border-radius: 8px;
	overflow: hidden;
	transition: transform 0.2s, box-shadow 0.2s;
	cursor: pointer;
}

.image-item:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-container {
	position: relative;
	width: 100%;
	padding-top: 100%;
	overflow: hidden;
	background: var(--background-tertiary);
}

.image-container img {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.image-info {
	padding: 8px;
	border-top: 1px solid var(--background-modifier-border);
}

.image-name {
	font-size: 0.85em;
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.image-size {
	font-size: 0.75em;
	color: var(--text-muted);
	margin-top: 2px;
}

/* ===== \u672A\u5F15\u7528\u56FE\u7247\u5217\u8868 ===== */
.stats-bar {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 12px 16px;
	background: var(--background-secondary);
	border-radius: 6px;
	margin-bottom: 16px;
}

.stats-count {
	font-weight: 600;
	color: var(--text-warning);
}

.stats-size {
	color: var(--text-muted);
}

.unreferenced-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.unreferenced-item {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 12px;
	background: var(--background-secondary);
	border-radius: 8px;
	transition: background 0.2s;
}

.unreferenced-item:hover {
	background: var(--background-tertiary);
}

.item-thumbnail {
	width: 60px;
	height: 60px;
	flex-shrink: 0;
	border-radius: 4px;
	overflow: hidden;
	background: var(--background-tertiary);
}

.item-thumbnail img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.item-info {
	flex: 1;
	min-width: 0;
}

.item-name {
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.item-path {
	font-size: 0.8em;
	color: var(--text-muted);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	margin-top: 2px;
}

.item-size {
	font-size: 0.85em;
	color: var(--text-muted);
	margin-top: 4px;
}

.item-actions {
	display: flex;
	gap: 8px;
	flex-shrink: 0;
}

/* ===== \u7A7A\u72B6\u6001 ===== */
.empty-state,
.loading-state,
.success-state,
.error-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48px;
	color: var(--text-muted);
	text-align: center;
}

.empty-state::before {
	content: '\u{1F5BC}\uFE0F';
	font-size: 48px;
	margin-bottom: 16px;
}

.success-state::before {
	content: '\u2705';
	font-size: 48px;
	margin-bottom: 16px;
}

.error-state::before {
	content: '\u274C';
	font-size: 48px;
	margin-bottom: 16px;
}

/* \u52A0\u8F7D\u52A8\u753B */
.spinner {
	width: 32px;
	height: 32px;
	border: 3px solid var(--background-modifier-border);
	border-top-color: var(--text-accent);
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin-bottom: 16px;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

/* ===== \u8BBE\u7F6E\u9875\u9762\u6837\u5F0F ===== */
.settings-divider {
	margin: 24px 0;
	border: none;
	border-top: 1px solid var(--background-modifier-border);
}

.settings-description {
	color: var(--text-muted);
	margin-bottom: 8px;
}

.settings-list {
	margin: 0;
	padding-left: 20px;
	color: var(--text-muted);
}

.settings-list li {
	margin-bottom: 4px;
}

/* ===== \u641C\u7D22\u6846\u6837\u5F0F ===== */
.search-container {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 16px;
	padding: 8px 12px;
	background: var(--background-secondary);
	border-radius: 6px;
}

.search-input {
	flex: 1;
	padding: 8px 12px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: var(--background-primary);
	color: var(--text-normal);
	font-size: 0.9em;
}

.search-input:focus {
	outline: none;
	border-color: var(--text-accent);
}

.search-icon {
	color: var(--text-muted);
}

.search-results-count {
	color: var(--text-muted);
	font-size: 0.85em;
}

.clear-search {
	padding: 4px;
	border: none;
	background: transparent;
	color: var(--text-muted);
	cursor: pointer;
}

.clear-search:hover {
	color: var(--text-normal);
}

/* ===== \u5206\u9875\u63A7\u4EF6 ===== */
.pagination {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	margin-top: 20px;
	padding: 16px;
	background: var(--background-secondary);
	border-radius: 6px;
}

.page-button {
	padding: 6px 12px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: var(--background-secondary);
	color: var(--text-normal);
	cursor: pointer;
}

.page-button:hover:not(:disabled) {
	background: var(--background-tertiary);
}

.page-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.page-info {
	color: var(--text-muted);
	font-size: 0.9em;
}

.page-jump-input {
	width: 50px;
	padding: 4px 8px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: var(--background-primary);
	color: var(--text-normal);
	text-align: center;
}

/* ===== \u9009\u62E9\u6A21\u5F0F\u5DE5\u5177\u680F ===== */
.selection-toolbar {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 16px;
	padding: 12px;
	background: var(--background-secondary);
	border-radius: 6px;
}

.selection-count {
	font-weight: 600;
	color: var(--text-accent);
}

.toolbar-button {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px;
	border: none;
	background: var(--background-tertiary);
	color: var(--text-normal);
	border-radius: 4px;
	cursor: pointer;
}

.toolbar-button:hover {
	background: var(--background-modifier-border);
}

.toolbar-button.danger {
	color: var(--text-error);
}

.toolbar-button.danger:hover {
	background: var(--background-modifier-error);
	color: white;
}

/* ===== \u56FE\u7247\u9009\u62E9\u6846 ===== */
.image-item {
	position: relative;
}

.item-checkbox {
	position: absolute;
	top: 8px;
	left: 8px;
	z-index: 10;
	width: 18px;
	height: 18px;
	cursor: pointer;
}

/* ===== \u9694\u79BB\u6587\u4EF6\u7BA1\u7406\u89C6\u56FE ===== */
.trash-management-view {
	height: 100%;
	overflow-y: auto;
	padding: 16px;
	box-sizing: border-box;
}

.trash-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20px;
	padding-bottom: 16px;
	border-bottom: 1px solid var(--background-modifier-border);
}

.trash-header h2 {
	margin: 0;
	font-size: 1.5em;
	font-weight: 600;
}

.trash-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.trash-item {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 12px;
	background: var(--background-secondary);
	border-radius: 8px;
	transition: background 0.2s;
}

.trash-item:hover {
	background: var(--background-tertiary);
}

.item-icon {
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--background-tertiary);
	border-radius: 4px;
	color: var(--text-muted);
}

.item-original-path {
	font-size: 0.8em;
	color: var(--text-muted);
	margin-top: 2px;
}

.item-date {
	font-size: 0.8em;
	color: var(--text-muted);
	margin-top: 2px;
}

/* ===== \u5A92\u4F53\u9884\u89C8 Modal ===== */
.media-preview-modal {
	max-width: 90vw;
	max-height: 90vh;
}

.media-preview-modal .modal-content {
	padding: 0;
	background: var(--background-primary);
}

.preview-close {
	position: absolute;
	top: 10px;
	right: 15px;
	font-size: 24px;
	color: var(--text-muted);
	cursor: pointer;
	z-index: 100;
}

.preview-close:hover {
	color: var(--text-normal);
}

.preview-container {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 400px;
	max-height: 70vh;
	overflow: auto;
}

.preview-image {
	max-width: 100%;
	max-height: 70vh;
	object-fit: contain;
}

.preview-video,
.preview-audio {
	max-width: 100%;
}

.preview-pdf {
	width: 100%;
	height: 70vh;
	border: none;
}

.preview-unsupported {
	padding: 40px;
	color: var(--text-muted);
}

.preview-nav {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	left: 0;
	right: 0;
	display: flex;
	justify-content: space-between;
	padding: 0 20px;
	pointer-events: none;
}

.nav-button {
	pointer-events: auto;
	font-size: 32px;
	padding: 10px 15px;
	border: none;
	background: var(--background-secondary);
	color: var(--text-normal);
	border-radius: 4px;
	cursor: pointer;
}

.nav-button:hover {
	background: var(--background-tertiary);
}

.nav-info {
	position: absolute;
	bottom: 10px;
	left: 50%;
	transform: translateX(-50%);
	padding: 4px 12px;
	background: var(--background-secondary);
	border-radius: 4px;
	font-size: 0.9em;
	color: var(--text-muted);
}

.preview-info-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 20px;
	background: var(--background-secondary);
	border-top: 1px solid var(--background-modifier-border);
}

.info-name {
	font-weight: 500;
}

.info-actions {
	display: flex;
	gap: 8px;
}

.info-actions button {
	padding: 4px 8px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: transparent;
	color: var(--text-normal);
	cursor: pointer;
}

.info-actions button:hover {
	background: var(--background-tertiary);
}

/* ===== \u91CD\u590D\u68C0\u6D4B\uFF08\u540E\u5907\u6837\u5F0F\uFF09 ===== */
.scan-progress {
	padding: 20px;
	text-align: center;
}

.progress-bar {
	height: 8px;
	background: var(--background-modifier-border);
	border-radius: 4px;
	overflow: hidden;
	margin: 16px 0;
}

.progress-fill {
	height: 100%;
	background: var(--interactive-accent);
	border-radius: 4px;
	transition: width 0.3s ease;
}

.progress-text {
	font-size: 0.9em;
	color: var(--text-muted);
}

.duplicate-detection-view {
	height: 100%;
	overflow-y: auto;
	padding: 16px;
	box-sizing: border-box;
}

.duplicate-header {
	margin-bottom: 16px;
	padding-bottom: 12px;
	border-bottom: 1px solid var(--background-modifier-border);
}

.duplicate-header .header-actions {
	display: flex;
	gap: 8px;
	align-items: center;
	margin-top: 8px;
}

.threshold-label {
	font-size: 0.85em;
	color: var(--text-muted);
}

.duplicate-group {
	margin-bottom: 16px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 8px;
	overflow: hidden;
}

/* ===== \u54CD\u5E94\u5F0F\u8BBE\u8BA1 ===== */
@media (max-width: 768px) {
	.image-library-header,
	.unreferenced-header {
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}

	.header-actions {
		width: 100%;
		justify-content: flex-end;
	}

	.unreferenced-item {
		flex-direction: column;
		align-items: flex-start;
	}

	.item-actions {
		width: 100%;
		justify-content: flex-end;
		margin-top: 8px;
	}
}`,document.head.appendChild(e)}async loadSettings(){try{let e=await this.loadData(),t=e&&typeof e=="object"?Object.fromEntries(Object.entries(e).filter(([c])=>c!=="__proto__"&&c!=="constructor"&&c!=="prototype")):{},n=Object.assign({},b,t),i=(c,d)=>typeof c=="boolean"?c:d,s=p(typeof n.imageFolder=="string"?n.imageFolder:""),r=typeof n.trashFolder=="string"?n.trashFolder:b.trashFolder,o=p(r)||b.trashFolder;this.settings={...b,...n,imageFolder:s,trashFolder:o,thumbnailSize:["small","medium","large"].includes(String(n.thumbnailSize))?n.thumbnailSize:b.thumbnailSize,sortBy:["name","date","size"].includes(String(n.sortBy))?n.sortBy:b.sortBy,sortOrder:["asc","desc"].includes(String(n.sortOrder))?n.sortOrder:b.sortOrder,defaultAlignment:["left","center","right"].includes(String(n.defaultAlignment))?n.defaultAlignment:b.defaultAlignment,language:["zh","en","system"].includes(String(n.language))?n.language:"system",trashCleanupDays:Math.max(1,Math.min(365,Number(n.trashCleanupDays)||b.trashCleanupDays)),pageSize:Math.max(1,Math.min(1e3,Number(n.pageSize)||b.pageSize)),showImageInfo:i(n.showImageInfo,b.showImageInfo),autoRefresh:i(n.autoRefresh,b.autoRefresh),useTrashFolder:i(n.useTrashFolder,b.useTrashFolder),autoCleanupTrash:i(n.autoCleanupTrash,b.autoCleanupTrash),enableImages:i(n.enableImages,b.enableImages),enableVideos:i(n.enableVideos,b.enableVideos),enableAudio:i(n.enableAudio,b.enableAudio),enablePDF:i(n.enablePDF,b.enablePDF),enablePreviewModal:i(n.enablePreviewModal,b.enablePreviewModal),enableKeyboardNav:i(n.enableKeyboardNav,b.enableKeyboardNav),safeScanEnabled:i(n.safeScanEnabled,b.safeScanEnabled),safeScanUnrefDays:Math.max(1,Math.min(365,Number(n.safeScanUnrefDays)||b.safeScanUnrefDays)),safeScanMinSize:Math.max(0,Number(n.safeScanMinSize)||b.safeScanMinSize),duplicateThreshold:Math.max(50,Math.min(100,Number(n.duplicateThreshold)||b.duplicateThreshold)),organizeRules:Array.isArray(n.organizeRules)?n.organizeRules:b.organizeRules,defaultProcessQuality:Math.max(1,Math.min(100,Number(n.defaultProcessQuality)||b.defaultProcessQuality)),defaultProcessFormat:["webp","jpeg","png"].includes(String(n.defaultProcessFormat))?n.defaultProcessFormat:b.defaultProcessFormat,watermarkText:typeof n.watermarkText=="string"?n.watermarkText:b.watermarkText}}catch(e){console.error("\u52A0\u8F7D\u8BBE\u7F6E\u5931\u8D25\uFF0C\u4F7F\u7528\u9ED8\u8BA4\u8BBE\u7F6E:",e),this.settings={...b}}}async saveSettings(){this.settings.imageFolder=p(this.settings.imageFolder),this.settings.trashFolder=p(this.settings.trashFolder)||b.trashFolder,await this.saveData(this.settings),await this.syncPerformanceInfraSettings(),this.clearCache(),this.scheduleRefreshOpenViews(150)}clearCache(){this.referencedImagesCache=null,this.cacheTimestamp=0}async openImageLibrary(){let{workspace:e}=this.app,t=e.getLeavesOfType(B)[0];t||(t=e.getLeaf("tab"),await t.setViewState({type:B,active:!0})),e.revealLeaf(t)}async findUnreferencedImages(){let{workspace:e}=this.app,t=e.getLeavesOfType(V)[0];t||(t=e.getLeaf("tab"),await t.setViewState({type:V,active:!0})),e.revealLeaf(t)}async getAllImageFiles(){let e=Z({enableImages:this.settings.enableImages,enableVideos:this.settings.enableVideos,enableAudio:this.settings.enableAudio,enablePDF:this.settings.enablePDF});return e.length===0?(new y.Notice(this.t("allMediaTypesDisabled")),[]):this.app.vault.getFiles().filter(n=>e.some(i=>n.name.toLowerCase().endsWith(i)))}async getAllMediaFiles(){return this.getAllImageFiles()}async getReferencedImages(e){let t=Date.now();if(this.referencedImagesCache&&t-this.cacheTimestamp<j.CACHE_DURATION)return this.referencedImagesCache;if(e?.aborted)throw new Error("Scan cancelled");let n=new Set,{vault:i}=this.app,r=Z({enableImages:this.settings.enableImages,enableVideos:this.settings.enableVideos,enableAudio:this.settings.enableAudio,enablePDF:this.settings.enablePDF}).map(x=>x.slice(1)).join("|");if(!r)return this.referencedImagesCache=n,this.cacheTimestamp=t,n;let o=`\\[\\[([^\\]|]+\\.(?:${r}))(?:\\|[^\\]]*)?\\]\\]`,c=`!?\\[[^\\]]*\\]\\(([^)]+\\.(?:${r})(?:\\?[^)#]*)?(?:#[^)]+)?)\\)`,d=(x,P)=>{if(!x)return;let v=x.trim();if(v.startsWith("<")&&v.endsWith(">")&&(v=v.slice(1,-1).trim()),v=v.replace(/\\ /g," "),v=O(v),/^[a-z][a-z0-9+.-]*:/i.test(v))return;let[L]=v.split(/[?#]/),A=p(L),X=this.app.metadataCache.getFirstLinkpathDest(A||L,P),R=X?p(X.path).toLowerCase():A.toLowerCase();R&&n.add(R)},g=i.getFiles().filter(x=>x.extension==="md"),h=g.length,u=300*1e3,T=Date.now(),S=null;e||(S=setTimeout(()=>{console.warn("Scan timeout reached, returning partial results")},u)),e&&e.addEventListener("abort",()=>{S&&clearTimeout(S),console.warn("Scan aborted by external signal")});let E=null;h>100&&(E=new y.Notice(this.t("scanningReferences")+` (0/${h})`,0));let k=20;for(let x=0;x<g.length;x+=k){if(Date.now()-T>u){console.warn("Scan timeout reached, returning partial results");break}if(e?.aborted){console.warn("Scan aborted");break}let P=g.slice(x,x+k);await Promise.all(P.map(async v=>{if(e?.aborted)return;let L;try{L=await i.read(v)}catch{return}let A=new RegExp(o,"gi"),X=new RegExp(c,"gi"),R;for(;(R=A.exec(L))!==null;)d(R[1],v.path);for(;(R=X.exec(L))!==null;)d(R[1],v.path)})),E&&x%(k*5)===0&&(E.hide(),E=new y.Notice(this.t("scanningReferences")+` (${Math.min(x+k,h)}/${h})`,0)),await new Promise(v=>setTimeout(v,0))}return S&&clearTimeout(S),E&&(E.hide(),new y.Notice(this.t("scanComplete")+` (${h} ${this.t("filesScanned")})`)),this.referencedImagesCache=n,this.cacheTimestamp=t,n}async findUnreferenced(){let e=await this.getAllImageFiles(),t=await this.getReferencedImages();return e.filter(n=>{let i=p(n.path).toLowerCase();return!t.has(i)})}async refreshCache(){this.referencedImagesCache=null,this.cacheTimestamp=0,await this.getReferencedImages(),new y.Notice(this.t("scanComplete"))}async openImageInNotes(e){let{workspace:t,vault:n}=this.app,i=[],s=e.name,r=n.getFiles().filter(o=>o.extension==="md");for(let o of r){let c;try{c=await n.read(o)}catch{continue}let d=c.split(`
`);for(let g=0;g<d.length;g++){let h=d[g];if(h.includes(s)&&(h.includes("[[")||h.includes("![")||h.includes("]("))){i.push({file:o,line:g+1});break}}}if(i.length>0){let o=i[0];await t.getLeaf("tab").openFile(o.file),o.line>1&&setTimeout(()=>{let d=t.getActiveViewOfType(y.MarkdownView);if(d){let g=d.editor;g.setCursor({ch:0,line:o.line-1}),g.scrollIntoView({from:{ch:0,line:o.line-1},to:{ch:0,line:o.line-1}},!0)}},100)}else new y.Notice(this.t("notReferenced"))}alignSelectedImage(e,t){let n=e.getSelection();if(!n){new y.Notice(this.t("selectImageFirst"));return}if(!n.includes("![")&&!n.includes("[[")){new y.Notice(this.t("selectImage"));return}let i=se.applyAlignment(n,t);e.replaceSelection(i);let s=t==="left"?"imageAlignedLeft":t==="center"?"imageAlignedCenter":"imageAlignedRight";new y.Notice(this.t(s))}addAlignmentMenuItems(e,t){let n=t.getSelection();!n||!n.includes("![")&&!n.includes("[[")||(e.addSeparator(),e.addItem(i=>{i.setTitle(this.t("alignImageLeft")).setIcon("align-left").onClick(()=>{this.alignSelectedImage(t,"left")})}),e.addItem(i=>{i.setTitle(this.t("alignImageCenter")).setIcon("align-center").onClick(()=>{this.alignSelectedImage(t,"center")})}),e.addItem(i=>{i.setTitle(this.t("alignImageRight")).setIcon("align-right").onClick(()=>{this.alignSelectedImage(t,"right")})}))}async ensureFolderExists(e){let t=p(e);if(!t)return!0;if(!z(t))return!1;let{vault:n}=this.app,i=t.split("/").filter(Boolean),s="";for(let r of i){s=s?`${s}/${r}`:r;let o=n.getAbstractFileByPath(s);if(!(o instanceof y.TFolder)){if(o)return!1;try{await n.createFolder(s)}catch{if(!(n.getAbstractFileByPath(s)instanceof y.TFolder))return!1}}}return!0}async safeDeleteFile(e){let{vault:t}=this.app;if(!this.settings.useTrashFolder)try{return await t.delete(e),!0}catch(d){return console.error("\u5220\u9664\u6587\u4EF6\u5931\u8D25:",d),new y.Notice(this.t("deleteFailedWithName",{name:e.name})),!1}let n=p(this.settings.trashFolder)||b.trashFolder;if(!z(n))return new y.Notice(this.t("operationFailed",{name:e.name})),!1;let i=e.name,s=Date.now(),r=encodeURIComponent(p(e.path)||e.name),o=`${s}__${r}`,c=`${n}/${o}`;try{return await this.ensureFolderExists(n)?(await t.rename(e,c),new y.Notice(this.t("movedToTrash",{name:i})),!0):(new y.Notice(this.t("operationFailed",{name:i})),!1)}catch(d){return console.error("\u79FB\u52A8\u6587\u4EF6\u5230\u9694\u79BB\u6587\u4EF6\u5939\u5931\u8D25:",d),new y.Notice(this.t("operationFailed",{name:i})),!1}}async restoreFile(e,t){let{vault:n}=this.app,i=p(O(t));if(!i||!z(i))return new y.Notice(this.t("restoreFailed",{message:this.t("error")})),!1;if(n.getAbstractFileByPath(i))return new y.Notice(this.t("restoreFailed",{message:this.t("targetFileExists")})),!1;let r=me(i);if(r&&!await this.ensureFolderExists(r))return new y.Notice(this.t("restoreFailed",{message:this.t("error")})),!1;let o=$(i)||e.name;try{return await n.rename(e,i),new y.Notice(this.t("restoreSuccess",{name:o})),!0}catch(c){return console.error("\u6062\u590D\u6587\u4EF6\u5931\u8D25:",c),new y.Notice(this.t("restoreFailed",{message:c.message})),!1}}async permanentlyDeleteFile(e){let{vault:t}=this.app;try{return await t.delete(e),new y.Notice(this.t("fileDeleted",{name:e.name})),!0}catch(n){return console.error("\u5F7B\u5E95\u5220\u9664\u6587\u4EF6\u5931\u8D25:",n),new y.Notice(this.t("deleteFailed")),!1}}};j.LEGACY_TRASH_FOLDER=".obsidian-media-toolkit-trash",j.CACHE_DURATION=300*1e3;var re=j;
