import {MODES,STORAGE_KEY,defaults,normalizeSettings,shortcutURL,isAppleMobile,validModeIndex} from "./modes.mjs";
import {createSnapSlider} from "./slider.mjs?v=2";
const $=id=>document.getElementById(id);
let settings=defaults(),modeIndex=1;
try{settings=normalizeSettings(JSON.parse(localStorage.getItem(STORAGE_KEY)));}catch{}
const mobile=isAppleMobile(navigator);
const dialog=$("settings-dialog"),slider=$("mode-slider"),apply=$("apply-mode");
let lastRequest=null;
const snapSlider=createSnapSlider(slider,$("slider-channel"),index=>{
  selectMode(index);
  if(settings.configured&&settings.autoApply)requestMode(modeIndex);
});
function setStatus(text){$("status").textContent=text;}
function refreshMode(){
  const mode=MODES[modeIndex];
  slider.setAttribute("aria-valuetext",mode.name);
  $("mode-name").textContent=mode.name;$("mode-description").textContent=mode.description;
  $("soundscape").dataset.mode=mode.key;
  document.querySelectorAll("[data-mode].mode-option").forEach(button=>{
    const selected=Number(button.dataset.mode)===modeIndex;
    button.setAttribute("aria-pressed",String(selected));button.classList.toggle("selected",selected);
  });
  apply.href=shortcutURL(settings.names[modeIndex]);
  $("apply-label").textContent=settings.configured?"应用"+mode.name:"先配置快捷指令";
  $("gesture-hint").textContent=!settings.configured?"自由拖动，松手吸附；配置后即可请求切换。":settings.autoApply?"拖动时跟手，松手吸附到最近档位并请求切换。":"自由拖动，松手吸附；点「应用」按钮请求切换。";
}
function openSettings(){
  MODES.forEach((mode,i)=>{$("shortcut-"+mode.key).value=settings.names[i];});
  $("configured").checked=settings.configured;$("auto-apply").checked=settings.autoApply;
  $("sheet-status").textContent="";
  dialog.showModal();
}
function persist(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(settings));return true;}catch{return false;}
}
function requestMode(index,names=settings.names,{test=false}={}){
  const name=names[index];
  let url;
  try{url=shortcutURL(name);}catch(error){$("sheet-status").textContent=error.message;return;}
  if(!mobile){
    const text="电脑上只能预览。请在 iPhone Safari 打开本页面，运行「"+name+"」。";
    if(test)$("sheet-status").textContent=text;else setStatus(text);
    return;
  }
  const text="已请求「"+MODES[index].name+"」。请在耳机或控制中心确认结果；需要时手动返回。";
  lastRequest=MODES[index].name;setStatus(text);
  if(test)$("sheet-status").textContent=text;
  window.location.href=url;
}
function selectMode(value){
  modeIndex=validModeIndex(value);snapSlider.select(modeIndex);refreshMode();
  setStatus(settings.configured?"已选择"+MODES[modeIndex].name+"，尚未确认耳机模式。":"这是档位预览；先完成快捷指令配置。");
}
document.querySelectorAll(".mode-option").forEach(button=>button.addEventListener("click",()=>{
  selectMode(button.dataset.mode);
  if(settings.configured&&settings.autoApply)requestMode(modeIndex);
}));
apply.addEventListener("click",event=>{
  event.preventDefault();
  if(!settings.configured){openSettings();return;}
  requestMode(modeIndex);
});
$("open-settings").addEventListener("click",openSettings);
$("setup-link").addEventListener("click",openSettings);
$("close-settings").addEventListener("click",()=>dialog.close());
dialog.addEventListener("click",event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
$("settings-form").addEventListener("submit",event=>{
  event.preventDefault();
  const names=MODES.map(mode=>$("shortcut-"+mode.key).value.trim());
  if(names.some(name=>!name||name.length>100)){$("sheet-status").textContent="请为三个模式分别填写快捷指令名称。";return;}
  if(new Set(names).size!==3){$("sheet-status").textContent="三条快捷指令需要不同的名称，才能切换到不同模式。";return;}
  settings={version:1,names,configured:$("configured").checked,autoApply:$("auto-apply").checked};
  const saved=persist();dialog.close();refreshMode();
  setStatus(!saved?"已应用配置，但浏览器未允许保存。下次打开需重新配置。":settings.configured?(mobile?"配置已保存。戴好并连接 AirPods 后，即可请求切换。":"配置已保存；电脑仅可预览，请在 iPhone 上完成实际测试。"):"名称已保存；在手机测试三条指令后，再勾选配置完成。");
});
document.querySelectorAll("[data-test]").forEach(button=>button.addEventListener("click",()=>{
  const names=MODES.map(mode=>$("shortcut-"+mode.key).value.trim());
  requestMode(Number(button.dataset.test),names,{test:true});
}));
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible"&&lastRequest)setStatus("上次请求："+lastRequest+"。本页面无法确认是否执行成功或读取当前模式。");
});
refreshMode();
if(settings.configured)setStatus(mobile?"已载入配置；耳机当前模式未知。":"电脑预览 · 实际切换需要在 iPhone 上运行快捷指令。");
