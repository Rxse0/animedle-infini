/* AnimeDle — tournoi local partagé (sauf Wordle). */
(() => {
"use strict";
if(document.getElementById("tournoi-launch")) return;
const KEY="animedle-tournoi-10manches-v1";
const LIMIT=10, PLAYERS=4;
const $=id=>document.getElementById(id);
const blank=()=>({version:2,active:false,finished:false,names:["","","",""],rounds:Array.from({length:LIMIT},()=>Array(PLAYERS).fill(false)),round:1});
const validNames=names=>Array.isArray(names)&&names.length===PLAYERS&&names.every(n=>typeof n==="string"&&n.trim().length>0&&n.trim().length<=22)&&new Set(names.map(n=>n.trim().toLocaleLowerCase("fr"))).size===PLAYERS;
function load(){
 try{
  const data=JSON.parse(localStorage.getItem(KEY));
  if(data&&data.version===1&&Array.isArray(data.names)&&data.names.length===3&&
     Array.isArray(data.rounds)&&data.rounds.length===LIMIT&&
     data.rounds.every(row=>Array.isArray(row)&&row.length===3&&row.every(x=>typeof x==="boolean"))){
    const used=new Set(data.names.map(n=>String(n).trim().toLocaleLowerCase("fr")));
    let fallback="Joueur 4",suffix=2;
    while(used.has(fallback.toLocaleLowerCase("fr")))fallback="Joueur 4 ("+(suffix++)+")";
    data.names.push(fallback);
    data.rounds.forEach(row=>row.push(false));
    data.version=2;
  }
  if(!data||data.version!==2||typeof data.active!=="boolean"||typeof data.finished!=="boolean"||
     !Array.isArray(data.rounds)||data.rounds.length!==LIMIT||
     data.rounds.some(row=>!Array.isArray(row)||row.length!==PLAYERS||row.some(x=>typeof x!=="boolean"))||
     !Number.isInteger(data.round)||data.round<1||data.round>LIMIT||
     (data.active&&!validNames(data.names)))return blank();
  return data;
 }catch{return blank();}
}
let state=load();
const totals=()=>Array.from({length:PLAYERS},(_,i)=>state.rounds.reduce((n,row)=>n+(row[i]?1:0),0));
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
const launch=document.createElement("button");
launch.type="button";launch.id="tournoi-launch";launch.className="tournoi-fab";
launch.innerHTML='<span class="tournoi-fab-icon" aria-hidden="true">🏆</span><span class="tournoi-fab-label">Tournoi · 4 joueurs</span>';
const dialog=document.createElement("dialog");
dialog.className="tournoi-modal";dialog.id="tournoi-modal";dialog.setAttribute("aria-labelledby","tournoi-title");
dialog.innerHTML="\n<div class=\"tournoi-header\">\n <div class=\"tournoi-header-left\"><span class=\"tournoi-emblem\" aria-hidden=\"true\">🏆</span><div><span class=\"tournoi-eyebrow\">MODE MULTIJOUEUR</span><h2 id=\"tournoi-title\">Tournoi à 4 joueurs</h2></div></div>\n <button class=\"tournoi-close\" type=\"button\" id=\"tournoi-close\" aria-label=\"Fermer le tableau des scores\">×</button>\n</div>\n<div class=\"tournoi-inner\">\n <section id=\"tournoi-setup\" aria-label=\"Créer un tournoi\">\n  <p class=\"tournoi-copy\">Entrez vos <strong>4 prénoms</strong> pour jouer sur le même ordinateur. Vous avez <strong>10 manches</strong> au total, même si vous changez de mini-jeu.</p>\n  <form id=\"tournoi-form\" class=\"tournoi-form\">\n   <div class=\"tournoi-field\"><label for=\"tournoi-name-0\">Joueur 1</label><input id=\"tournoi-name-0\" maxlength=\"22\" autocomplete=\"off\" placeholder=\"Prénom du joueur 1\" required></div>\n   <div class=\"tournoi-field\"><label for=\"tournoi-name-1\">Joueur 2</label><input id=\"tournoi-name-1\" maxlength=\"22\" autocomplete=\"off\" placeholder=\"Prénom du joueur 2\" required></div>\n   <div class=\"tournoi-field\"><label for=\"tournoi-name-2\">Joueur 3</label><input id=\"tournoi-name-2\" maxlength=\"22\" autocomplete=\"off\" placeholder=\"Prénom du joueur 3\" required></div>\n   <div class=\"tournoi-field\"><label for=\"tournoi-name-3\">Joueur 4</label><input id=\"tournoi-name-3\" maxlength=\"22\" autocomplete=\"off\" placeholder=\"Prénom du joueur 4\" required></div>\n   <p class=\"tournoi-error\" id=\"tournoi-error\" role=\"alert\"></p>\n   <button class=\"tournoi-main-btn\" type=\"submit\">Commencer les 10 manches →</button>\n  </form>\n </section>\n <section id=\"tournoi-match\" hidden aria-label=\"Tableau des scores\">\n  <div class=\"tournoi-meta\"><span id=\"tournoi-round-label\">MANCHE 1 / 10</span><b id=\"tournoi-total-label\">0 point attribué</b></div>\n  <div class=\"tournoi-progress\" id=\"tournoi-progress\" aria-hidden=\"true\"></div>\n  <p class=\"tournoi-help\">Bonne réponse ? Cliquez sur <strong>+1 point</strong> à côté du prénom. Plusieurs joueurs peuvent gagner un point pendant la même manche.</p>\n  <div class=\"tournoi-players\" id=\"tournoi-players\"></div>\n  <div class=\"tournoi-actions\">\n   <button type=\"button\" class=\"tournoi-sub-btn\" id=\"tournoi-prev\">← Précédente</button>\n   <button type=\"button\" class=\"tournoi-main-btn\" id=\"tournoi-next\">Manche suivante →</button>\n  </div>\n  <p class=\"tournoi-note\">Vous décidez quand passer à la manche suivante. Pour corriger un score, cliquez sur « Annuler −1 » ou revenez à une manche précédente.</p>\n </section>\n <section id=\"tournoi-final\" class=\"tournoi-finish\" hidden aria-label=\"Classement final\">\n  <div class=\"tournoi-finish-kicker\">10 / 10 MANCHES TERMINÉES</div>\n  <h3>🏆 Classement final</h3>\n  <p id=\"tournoi-winner\"></p>\n  <ol class=\"tournoi-ranking\" id=\"tournoi-ranking\"></ol>\n  <div class=\"tournoi-finish-actions\">\n   <button type=\"button\" class=\"tournoi-sub-btn\" id=\"tournoi-edit-last\">← Corriger la manche 10</button>\n   <button type=\"button\" class=\"tournoi-main-btn\" id=\"tournoi-new\">Nouveau tournoi →</button>\n  </div>\n </section>\n</div>\n<div class=\"tournoi-reset-wrap\"><span>Scores sauvegardés sur cet ordinateur. Wordle ne participe pas au tournoi.</span><button type=\"button\" class=\"tournoi-reset\" id=\"tournoi-reset\">Tout recommencer</button></div>";
document.body.append(launch,dialog);
const setup=$("tournoi-setup"),match=$("tournoi-match"),final=$("tournoi-final");
const fourthEdit=document.createElement("button");
fourthEdit.type="button";fourthEdit.className="tournoi-reset";fourthEdit.textContent="Renommer le joueur 4";
fourthEdit.setAttribute("aria-label","Modifier le nom du quatrième joueur");
$("tournoi-reset").before(fourthEdit);
fourthEdit.addEventListener("click",()=>{
 if(!state.active)return;
 const name=window.prompt("Prénom du quatrième joueur :",state.names[3]);
 if(name===null)return;
 const trial=[...state.names];trial[3]=name.trim();
 if(!validNames(trial)){window.alert("Choisis un prénom différent des trois autres (22 caractères maximum).");return;}
 state.names=trial;save();render();
});
function renderButton(){
 const label=!state.active?"Tournoi · 4 joueurs":state.finished?"Classement final":"Tournoi · "+state.round+"/"+LIMIT;
 launch.querySelector(".tournoi-fab-label").textContent=label;
 launch.setAttribute("aria-label","Ouvrir le tableau des scores : "+label);
}
function renderPlayers(){
 const scores=totals(),frag=document.createDocumentFragment();
 for(let i=0;i<PLAYERS;i++){
  const credited=state.rounds[state.round-1][i];
  const item=document.createElement("div");
  item.className="tournoi-person"+(credited?" won":"");
  const person=document.createElement("div");person.className="tournoi-person-info";
  const avatar=document.createElement("span");avatar.className="tournoi-avatar";avatar.textContent=state.names[i].slice(0,1).toLocaleUpperCase("fr");
  const info=document.createElement("div");
  const name=document.createElement("span");name.className="tournoi-person-name";name.textContent=state.names[i];
  const count=document.createElement("span");count.className="tournoi-person-points";
  const strong=document.createElement("strong");strong.textContent=scores[i];
  count.append(strong,document.createTextNode(" point"+(scores[i]>1?"s":"")));
  info.append(name,count);person.append(avatar,info);
  const b=document.createElement("button");b.type="button";b.className="tournoi-add";b.dataset.player=String(i);
  b.textContent=credited?"Annuler −1":"+1 point";
  b.setAttribute("aria-label",(credited?"Retirer le point de ":"Donner un point à ")+state.names[i]+" pour cette manche");
  item.append(person,b);frag.append(item);
 }
 $("tournoi-players").replaceChildren(frag);
}
function renderFinish(){
 const data=state.names.map((name,index)=>({name,index,points:totals()[index]})).sort((a,b)=>b.points-a.points||a.index-b.index);
 const max=data[0].points,leaders=data.filter(p=>p.points===max);
 $("tournoi-winner").textContent=leaders.length===1?
  "Bravo "+leaders[0].name+" ! "+max+" point"+(max===1?"":"s")+" sur 10 manches.":
  "Égalité en tête : "+leaders.map(p=>p.name).join(", ")+" — "+max+" point"+(max===1?"":"s")+".";
 const fragment=document.createDocumentFragment();
 let rank=0;
 for(let i=0;i<data.length;i++){
  if(i===0||data[i].points!==data[i-1].points)rank=i+1;
  const li=document.createElement("li");li.className="tournoi-rank";
  const med=document.createElement("span");med.className="tournoi-medal";med.textContent=["🥇","🥈","🥉"][rank-1]||String(rank);
  const name=document.createElement("span");name.className="tournoi-rankname";name.textContent=data[i].name;
  const score=document.createElement("span");score.className="tournoi-rankpoints";
  const strong=document.createElement("b");strong.textContent=data[i].points;
  score.append(strong,document.createTextNode(" pt"+(data[i].points>1?"s":"")));
  li.append(med,name,score);fragment.append(li);
 }
 $("tournoi-ranking").replaceChildren(fragment);
}
function render(){
 renderButton();
 setup.hidden=state.active;
 match.hidden=!state.active||state.finished;
 final.hidden=!state.active||!state.finished;
 $("tournoi-reset").hidden=!state.active;
 fourthEdit.hidden=!state.active;
 if(!state.active)return;
 if(state.finished){renderFinish();return;}
 $("tournoi-round-label").textContent="MANCHE "+state.round+" / "+LIMIT;
 const n=state.rounds.flat().filter(Boolean).length;
 $("tournoi-total-label").textContent=n+" point"+(n>1?"s":"")+" attribué"+(n>1?"s":"");
 const frag=document.createDocumentFragment();
 for(let i=1;i<=LIMIT;i++){
  const el=document.createElement("span");
  el.className="tournoi-dot"+(i<state.round?" done":i===state.round?" now":"");
  frag.append(el);
 }
 $("tournoi-progress").replaceChildren(frag);
 $("tournoi-prev").disabled=state.round<=1;
 $("tournoi-next").textContent=state.round===LIMIT?"Voir le classement 🏆":"Manche suivante →";
 renderPlayers();
}
$("tournoi-form").addEventListener("submit",e=>{
 e.preventDefault();
 const names=Array.from({length:PLAYERS},(_,i)=>$("tournoi-name-"+i).value.trim());
 if(!validNames(names)){$("tournoi-error").textContent="Indique quatre prénoms différents (22 caractères maximum).";return;}
 state=blank();state.active=true;state.names=names;
 $("tournoi-error").textContent="";
 save();render();
});
$("tournoi-players").addEventListener("click",e=>{
 const b=e.target.closest("button[data-player]");
 if(!b||!state.active||state.finished)return;
 const i=Number(b.dataset.player);
 if(!Number.isInteger(i)||i<0||i>=PLAYERS)return;
 state.rounds[state.round-1][i]=!state.rounds[state.round-1][i];
 save();render();
});
$("tournoi-next").addEventListener("click",()=>{
 if(!state.active||state.finished)return;
 if(state.round>=LIMIT)state.finished=true;else state.round++;
 save();render();
});
$("tournoi-prev").addEventListener("click",()=>{
 if(!state.active||state.finished||state.round<=1)return;
 state.round--;save();render();
});
$("tournoi-edit-last").addEventListener("click",()=>{
 if(!state.active||!state.finished)return;
 state.finished=false;state.round=LIMIT;save();render();
});
function reset(){
 if(state.active&&!window.confirm("Effacer ce tournoi et tous les scores des 4 joueurs ?"))return;
 state=blank();save();
 for(let i=0;i<PLAYERS;i++)$("tournoi-name-"+i).value="";
 $("tournoi-error").textContent="";render();
}
$("tournoi-reset").addEventListener("click",reset);
$("tournoi-new").addEventListener("click",reset);
$("tournoi-close").addEventListener("click",()=>dialog.close());
dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
launch.addEventListener("click",()=>{
 render();
 if(typeof dialog.showModal==="function")dialog.showModal();
 else dialog.setAttribute("open","");
});
window.addEventListener("storage",e=>{if(e.key===KEY){state=load();render();}});
render();
})();
