export const MODES = Object.freeze([
  Object.freeze({key:"transparency",name:"通透",shortcut:"AirPods 通透",description:"让周围的声音进来，与世界保持连接。"}),
  Object.freeze({key:"adaptive",name:"自适应",shortcut:"AirPods 自适应",description:"随环境变化，平衡安静与周围的声音。"}),
  Object.freeze({key:"cancellation",name:"降噪",shortcut:"AirPods 降噪",description:"减少外界噪声，把注意力留给此刻。"})
]);
export const STORAGE_KEY = "tingjing.settings.v1";
export function defaults(){return {version:1,names:MODES.map(m=>m.shortcut),configured:false,autoApply:true};}
export function normalizeSettings(value){
  const base=defaults();
  if(!value||typeof value!=="object"||value.version!==1)return base;
  return {version:1,names:MODES.map((m,i)=>typeof value.names?.[i]==="string"&&value.names[i].trim()&&value.names[i].trim().length<=100?value.names[i].trim():m.shortcut),configured:value.configured===true,autoApply:value.autoApply!==false};
}
export function shortcutURL(name){
  if(typeof name!=="string"||!name.trim()||name.trim().length>100)throw new Error("请填写有效的快捷指令名称。");
  return "shortcuts://run-shortcut?name="+encodeURIComponent(name.trim());
}
export function isAppleMobile(nav){return /iPhone|iPad|iPod/.test(nav.userAgent)||(nav.platform==="MacIntel"&&nav.maxTouchPoints>1);}
export function validModeIndex(value){const index=Number(value);return Number.isInteger(index)&&index>=0&&index<MODES.length?index:1;}
