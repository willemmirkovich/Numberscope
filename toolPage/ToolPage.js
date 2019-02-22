var logoColor = "#afafdc";
var topBarColor = "#f75c03";
var sideNavColor = "#416788";
var sideNavColor2 = "#70cad1";
var numSequences = 1;
var numTools = 1;
var numDraw = 1;

//Example Navigation Bar
function openExNav() {
    document.getElementById("exampleNav").style.width = "12em";
    document.getElementById("title1").style.marginLeft = "4.5em";
    document.getElementById("mainCanvas").style.marginLeft = "12em";

    let list1 = ["sideNav", "stepNav", "selectNav", "seqInputNav"];
    for (let i = 0; i < list1.length; i++) {
      let elements = document.getElementsByClassName(list1[i]);
      for(let j = 0, length = elements.length; j < length; j++) {
        elements[j].style.marginLeft = "12em";
      }
    }
}
function closeExNav() {
    document.getElementById("exampleNav").style.width = "0";
    document.getElementById("title1").style.marginLeft = "0";
    document.getElementById("mainCanvas").style.marginLeft = "0";

    let list1 = ["sideNav", "stepNav", "selectNav", "seqInputNav"];
    for (let i = 0; i < list1.length; i++) {
      let elements = document.getElementsByClassName(list1[i]);
      for(let j = 0, length = elements.length; j < length; j++) {
        elements[j].style.marginLeft = "0em";
      }
    }
}

function openNav(n){
  if(n == 1){
    document.getElementById("title1").innerHTML = "Pick an Integer Sequence";
    document.getElementById("step1Nav").style.width = "12em";
    document.getElementById("step1").style.background = sideNavColor2;
    closeNav(2);
    closeNav(3);
  }
  else if (n == 2) {
    document.getElementById("title1").innerHTML = "Pick a Visualization Tool";
    document.getElementById("step2Nav").style.width = "12em";
    document.getElementById("step2").style.background = sideNavColor2;
    closeNav(1);
    closeNav(3);
  }
  else if (n == 3) {
    document.getElementById("title1").innerHTML = "Pick Sequence to Draw";
    document.getElementById("step3Nav").style.width = "36em";
    document.getElementById("step3").style.background = sideNavColor2;
    //document.getElementsByTagName('body').style.backgroundImage = "sequenceDraw.jpg";
    closeNav(1);
    closeNav(2);
  }
}
function closeNav(n){
  if (n==1) {
    document.getElementById("step1Nav").style.width = "0";
    document.getElementById("step1").style.background = sideNavColor;

    for (let k = 1; k <= numSequences; k++) {
      closeSeqNav(k);
    }
  }
  else if (n==2) {
    document.getElementById("step2Nav").style.width = "0";
    document.getElementById("step2").style.background = sideNavColor;
    for (let k = 1; k <= numTools; k++) {
      closeToolNav(k);
    }
  }
  else if (n==3) {
    document.getElementById("step3Nav").style.width = "0";
    document.getElementById("step3").style.background = sideNavColor;
  }
}

function openCanvas(){
  closeNav(n=3);
  document.getElementById("mainCanvas").style.width = "100%";
}

//Sequence Navigation Bars
function openSeqNav(n){
  document.getElementById("title1").innerHTML = "Pick an Input Method";
  for (let i = 1; i <= numSequences; i++) {
    let curSeqNav = "seqNav" + i;
    document.getElementById(curSeqNav).style.width = "0em";
  }
  let selectedNav = "seqNav" + n;
  document.getElementById(selectedNav).style.width = "12em";

  for (let i = 1; i <= numSequences; i++) {
    let curSeq = "seq" + i;
    if (i == n) {
      document.getElementById(curSeq).style.background = logoColor;
    }
    else {
      document.getElementById(curSeq).style.background = sideNavColor2;
    }
  }

  for (let i = 1; i <= numSequences; i++) {
    for (let j = 1; j <= 4; j++) {
      closeSeqInputNav(i,j);
    }
  }
}
function closeSeqNav(n){
  let selectedNav = "seqNav" + n;
  document.getElementById(selectedNav).style.width = "0";
  for (let i = 1; i <= numSequences; i++) {
    let curSeq = "seq" + i;
    document.getElementById(curSeq).style.background = sideNavColor2;
  }
  for (let i = 1; i <= numSequences; i++) {
    for (let j = 1; j <= 4; j++) {
      closeSeqInputNav(i,j);
    }
  }
}

function openSeqInputNav(n,m){
  if (m==1) {
    let u = "builtInInputNav" + n;
    document.getElementById(u).style.width = "24em";
    let v = "builtIn" + n;
    document.getElementById(v).style.background = topBarColor;
    //document.getElementById(v).style.borderLeft = "solid", sideNavColor;

    // let linRecNumber = "builtInSelect" + n;
    // let linRecNav = "linRecNav" + n;
    // if (document.getElementById(linRecNumber).value == "linRec") {
    //   extendLinRec(n);
    // }

    closeSeqInputNav(n,3);
    closeSeqInputNav(n,4);
    closeSeqInputNav(n,2);
  }
  else if (m==2) {
    let u = "oeisInputNav" + n;
    document.getElementById(u).style.width = "12em";
    let v = "OEIS" + n;
    document.getElementById(v).style.background = topBarColor;
    closeSeqInputNav(n,4);
    closeSeqInputNav(n,3);
    closeSeqInputNav(n,1);
  }
  else if (m==3) {
    let u = "listInputNav" + n;
    document.getElementById(u).style.width = "24em";
    let v = "list" + n
    document.getElementById(v).style.background = topBarColor;
    closeSeqInputNav(n,4);
    closeSeqInputNav(n,2);
    closeSeqInputNav(n,1);
  }
  else if (m==4) {
    let u = "codeInputNav" + n;
    document.getElementById(u).style.width = "24em";
    let v = "code" + n;
    document.getElementById(v).style.background = topBarColor;
    closeSeqInputNav(n,3);
    closeSeqInputNav(n,2);
    closeSeqInputNav(n,1);
  }
}
function closeSeqInputNav(n,m){
  if (m==1) {
    let f = "builtInInputNav" + n;
    document.getElementById(f).style.width = "0";
    let g = "builtIn" + n;
    document.getElementById(g).style.background = logoColor;
    // let linRecNav = "linRecNav" + n;
    // document.getElementById(linRecNav).style.height = "0em";
  }
  else if (m==2) {
    let f = "oeisInputNav" + n;
    document.getElementById(f).style.width = "0";
    let g = "OEIS" + n;
    document.getElementById(g).style.background = logoColor;
  }
  else if (m==3) {
    let f = "listInputNav" + n;
    document.getElementById(f).style.width = "0";
    let g = "list" + n;
    document.getElementById(g).style.background = logoColor;
  }
  else if (m==4) {
    let f = "codeInputNav" + n;
    document.getElementById(f).style.width = "0";
    let g = "code" + n;
    document.getElementById(g).style.background = logoColor;
  }
}

//Linear Recurrence
// let linRecHeights = ["8.5em", "11.5em", "14em", "16.5em", "19.5em", "22em", "24.7em", "27.5em", "30em", "34em" ]
// function openLinRec(n){
//   let linRecNumber = "builtInSelect" + n;
//   let linRecNav = "linRecNav" + n;
//   if (document.getElementById(linRecNumber).value == "linRec") {
//     let curkSelect = "kSelect" + n;
//     let linRecNavLength = document.getElementById(curkSelect).value;
//     let linRecNavLength = parseInt(linRecNavLength, 10) - 1;
//     let newHeight = linRecHeights[linRecNavLength];
//     document.getElementById(linRecNav).style.height = newHeight;
//   }
//   else {
//     document.getElementById(linRecNav).style.height = "0";
//   }
// }
// function extendLinRec(n){
//   let linRecNav = "linRecNav" + n;
//   let curkSelect = "kSelect" + n;
//   let linRecNavLength = document.getElementById(curkSelect).value;
//   let linRecNavLength = parseInt(linRecNavLength, 10) - 1;
//   let newHeight = linRecHeights[linRecNavLength];
//   document.getElementById(linRecNav).style.height = newHeight;
// }

//Tool Navigation Bars
function openToolNav(n){
  for (let i = 1; i <= numTools; i++) {
    let curToolNav = "toolNav" + i;
    document.getElementById(curToolNav).style.width = "0em";
  }
  let selectedNav = "toolNav" + n;
  document.getElementById(selectedNav).style.width = "24em";

  for (let i = 1; i <= numTools; i++) {
    let curTool = "tool" + i;
    if (i == n) {
      document.getElementById(curTool).style.background = logoColor;
    }
    else {
      document.getElementById(curTool).style.background = sideNavColor2;
    }
  }
}
function closeToolNav(n){
  let selectedNav = "toolNav" + n;
  document.getElementById(selectedNav).style.width = "0";
  for (let i = 1; i <= numTools; i++) {
    let curTool = "tool" + i;
    document.getElementById(curTool).style.background = sideNavColor2;
  }
}

function openToolInputNav(n,m){

}

function addSeq(){
  if(numSequences < 10){
    let seqLetter = String.fromCharCode(97 + numSequences);
    numSequences += 1;

    let a = document.createElement('a');
    a.innerHTML = "{" + seqLetter + "<sub>n</sub>}";
    a.setAttribute("href", "#");

    let idName = "seq" + numSequences;
    a.setAttribute("id", idName);

    let fctCall = "openSeqNav(n=" + numSequences + ")";
    a.setAttribute("onclick", fctCall);

    document.getElementById("step1Nav").append(a);
    ////////////////////////////////
    for (let i = 1; i <= numDraw; i++) {
      let opt = document.createElement("option");
      opt.innerHTML = "{" + seqLetter + "<sub>n</sub>}";

      let valueName = numSequences;
      opt.setAttribute("value", valueName);

      let curSelect = "selectSeq" + i;
      document.getElementById(curSelect).append(opt);
    }
    ////////////////////////////////
    //Create new Function Input Nav
    let newNav = document.createElement("div");
    let navId = "seqNav" + numSequences;
    newNav.setAttribute("id", navId);
    newNav.setAttribute("class", "selectNav");

    //Close Btn Link
    a = document.createElement('a');
    let newId = "seqCloseBtn" + numSequences;
    a.setAttribute("id", newId);
    a.setAttribute("href", "javascript:void(0)");
    a.setAttribute("class", "selectClosebtn");
    fctCall = "closeSeqNav(n=" + numSequences + ")";
    a.setAttribute("onclick", fctCall);
    a.innerHTML = "&#171";
    newNav.appendChild(a);

    //builtIn Link
    let builtInLink = document.createElement('a');
    let builtInId = "builtIn" + numSequences;
    builtInLink.setAttribute("id", builtInId);
    builtInLink.setAttribute("href", "#");
    fctCall = "openSeqInputNav(n=" + numSequences + ",m=1)";
    builtInLink.setAttribute("onclick", fctCall);
    builtInLink.innerHTML = "Built In";
    newNav.appendChild(builtInLink);

    //OEIS Link
    let oeisLink = document.createElement('a');
    let oeisId = "OEIS" + numSequences;
    oeisLink.setAttribute("id", oeisId);
    oeisLink.setAttribute("href", "#");
    fctCall = "openSeqInputNav(n=" + numSequences + ",m=2)";
    oeisLink.setAttribute("onclick", fctCall);
    oeisLink.innerHTML = "OEIS";
    newNav.appendChild(oeisLink);

    //List Link
    let listLink = document.createElement('a');
    let listId = "list" + numSequences;
    listLink.setAttribute("id", listId);
    listLink.setAttribute("href", "#");
    fctCall = "openSeqInputNav(n=" + numSequences + ",m=3)";
    listLink.setAttribute("onclick", fctCall);
    listLink.innerHTML = "List";
    newNav.appendChild(listLink);

    //Code Link
    let codeLink = document.createElement('a');
    let codeId = "code" + numSequences;
    codeLink.setAttribute("id", codeId);
    codeLink.setAttribute("href", "#");
    fctCall = "openSeqInputNav(n=" + numSequences + ",m=4)";
    codeLink.setAttribute("onclick", fctCall);
    codeLink.innerHTML = "Sage Code";
    newNav.appendChild(codeLink);

    document.getElementById("seqNavs").append(newNav);
    ///////////////////////////////////////////////
    //Create Function Input Nav
    newNav = document.createElement("div");
    newId = "builtInInputNav" + numSequences;
    newNav.setAttribute("id", newId);
    newNav.setAttribute("class", "seqInputNav");

    a = document.createElement('a');
    let closeId = "builtInCloseBtn" + numSequences;
    a.setAttribute("id", closeId);
    a.setAttribute("href", "javascript:void(0)");
    a.setAttribute("class", "closebtn");
    fctCall = "closeSeqInputNav(n=" + numSequences + ",m=1)";
    a.setAttribute("onclick", fctCall);
    a.innerHTML = "&#171";
    newNav.appendChild(a);

    document.getElementById("builtInInputNavs").append(newNav);

    //Create OEIS Input Nav
    newNav = document.createElement("div");
    newId = "oeisInputNav" + numSequences;
    newNav.setAttribute("id", newId);
    newNav.setAttribute("class", "seqInputNav");

    a = document.createElement('a');
    closeId = "oeisCloseBtn" + numSequences;
    a.setAttribute("id", closeId);
    a.setAttribute("href", "javascript:void(0)");
    a.setAttribute("class", "closebtn");
    fctCall = "closeSeqInputNav(n=" + numSequences + ",m=2)";
    a.setAttribute("onclick", fctCall);
    a.innerHTML = "&#171";
    newNav.appendChild(a);

    newli = document.createElement("li");
    newli.innerHTML = "OEIS Number: ";
    newNav.appendChild(newli);

    newText = document.createElement("textarea");
    newId = "oeisNum" + numSequences;
    newText.setAttribute("id", newId);
    newText.setAttribute("class", "oeisNum");
    newNav.appendChild(newText);

    document.getElementById("oeisInputNavs").append(newNav);

    //Create List Input Nav
    newNav = document.createElement("div");
    newId = "listInputNav" + numSequences;
    newNav.setAttribute("id", newId);
    newNav.setAttribute("class", "seqInputNav");

    a = document.createElement('a');
    closeId = "listCloseBtn" + numSequences;
    a.setAttribute("id", closeId);
    a.setAttribute("href", "javascript:void(0)");
    a.setAttribute("class", "closebtn");
    fctCall = "closeSeqInputNav(n=" + numSequences + ",m=3)";
    a.setAttribute("onclick", fctCall);
    a.innerHTML = "&#171";
    newNav.appendChild(a);

    document.getElementById("listInputNavs").append(newNav);

    //Create Code Input Nav
    newNav = document.createElement("div");
    newId = "codeInputNav" + numSequences;
    newNav.setAttribute("id", newId);
    newNav.setAttribute("class", "seqInputNav");

    a = document.createElement('a');
    closeId = "codeCloseBtn" + numSequences;
    a.setAttribute("id", closeId);
    a.setAttribute("href", "javascript:void(0)");
    a.setAttribute("class", "closebtn");
    fctCall = "closeSeqInputNav(n=" + numSequences + ",m=4)";
    a.setAttribute("onclick", fctCall);
    a.innerHTML = "&#171";
    newNav.appendChild(a);

    document.getElementById("codeInputNavs").append(newNav);
  }
}
function addTool(){
  if(numTools < 10){
    let toolNum = numTools + 1;
    numTools += 1;

    let a = document.createElement('a');
    a.innerHTML = "Tool " + toolNum;
    a.setAttribute("href", "#");

    let idName = "tool" + numTools;
    a.setAttribute("id", idName);

    let fctCall = "openToolNav(n=" + numTools + ")";
    a.setAttribute("onclick", fctCall);

    document.getElementById("step2Nav").append(a);
    ////////////////////////////////
    for (let i = 1; i <= numDraw; i++) {
      let opt = document.createElement("option");
      opt.innerHTML = "Tool " + numTools;

      let valueName = numTools;
      opt.setAttribute("value", valueName);

      let curSelect = "selectTool" + i;
      document.getElementById(curSelect).append(opt);

      ////////////////////////////////
      //Create new Function Input Nav
      let newNav = document.createElement("div");
      let navId = "toolNav" + numTools;
      newNav.setAttribute("id", navId);
      newNav.setAttribute("class", "selectNav");

      //Close Btn Link
      a = document.createElement('a');
      let newId = "toolCloseBtn" + numSequences;
      a.setAttribute("id", newId);
      a.setAttribute("href", "javascript:void(0)");
      a.setAttribute("class", "selectClosebtn");
      fctCall = "closeToolNav(n=" + numTools + ")";
      a.setAttribute("onclick", fctCall);
      a.innerHTML = "&#171";
      newNav.appendChild(a);

      //Turtle Walk Link
      let turtleLink = document.createElement('a');
      let turtleId = "turtle" + numTools;
      turtleLink.setAttribute("id", turtleId);
      turtleLink.setAttribute("href", "#");
      fctCall = "openToolInputNav(n=" + numTools + ",m=1)";
      turtleLink.setAttribute("onclick", fctCall);
      turtleLink.innerHTML = "Turtle Walk";
      newNav.appendChild(turtleLink);

      //Game of Life Link
      let golLink = document.createElement('a');
      let golId = "gol" + numTools;
      golLink.setAttribute("id", golId);
      golLink.setAttribute("href", "#");
      fctCall = "openToolInputNav(n=" + numTools + ",m=2)";
      golLink.setAttribute("onclick", fctCall);
      golLink.innerHTML = "Game of Life";
      newNav.appendChild(golLink);

      //Shift Comparision Link
      let shiftLink = document.createElement('a');
      let shiftId = "shift" + numTools;
      shiftLink.setAttribute("id", shiftId);
      shiftLink.setAttribute("href", "#");
      fctCall = "openToolInputNav(n=" + numTools + ",m=3)";
      shiftLink.setAttribute("onclick", fctCall);
      shiftLink.innerHTML = "Shift Comparision";
      newNav.appendChild(shiftLink);

      document.getElementById("toolNavs").append(newNav);
    }
  }
}
function addDraw(){
  if(numDraw < 10){
    numDraw += 1;
    /////////////////////////////////////
    let a = document.createElement('a');
    a.innerHTML = numDraw + ".";
    a.setAttribute("href", "#");
    a.setAttribute("class", "numColumn");
    document.getElementById("drawListNum").append(a);
    /////////////////////////////////////
    let sel = document.createElement("select");
    let selIDName = "selectSeq" + numDraw;
    sel.setAttribute("id", selIDName);
    document.getElementById("drawSeqList").append(sel);

    for (let i = 1; i <= numSequences; i++) {
      let j = 97 + (i - 1);
      let seqLetter = String.fromCharCode(j);
      let opt = document.createElement("option");
      opt.innerHTML = "{" + seqLetter + "<sub>n</sub>}";

      let valueName = "s" + i;
      opt.setAttribute("value", valueName);

      document.getElementById(selIDName).append(opt);
    }
    /////////////////////////////////////
    sel = document.createElement("select");
    selIDName = "selectTool" + numDraw;
    sel.setAttribute("id", selIDName);
    document.getElementById("drawToolList").append(sel);

    for (let i = 1; i <= numTools; i++) {
      let j = 97 + (i - 1);
      let seqLetter = String.fromCharCode(j);
      let opt = document.createElement("option");
      opt.innerHTML = "Tool " + i;

      let valueName = "t" + i;
      opt.setAttribute("value", valueName);

      document.getElementById(selIDName).append(opt);
    }
    // /////////////////////////////////////
    a = document.createElement('a');
    let removeId = "drawRemove" + numDraw;
    a.setAttribute("id", removeId);
    let fctCall = "removeDraw(n=" + numDraw + ")";
    a.setAttribute("onclick", fctCall);
    a.innerHTML = "&times";
    a.setAttribute("href", "#");

    document.getElementById("drawRemoveBtns").append(a);
  }
}
function removeDraw(n){

}
