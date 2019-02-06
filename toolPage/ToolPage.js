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

    var list1 = ["sideNav", "stepNav", "selectNav", "seqInputNav"];
    for (var i = 0; i < list1.length; i++) {
      var elements = document.getElementsByClassName(list1[i]);
      for(var j = 0, length = elements.length; j < length; j++) {
        elements[j].style.marginLeft = "12em";
      }
    }
}
function closeExNav() {
    document.getElementById("exampleNav").style.width = "0";
    document.getElementById("title1").style.marginLeft = "0";
    document.getElementById("mainCanvas").style.marginLeft = "0";

    var list1 = ["sideNav", "stepNav", "selectNav", "seqInputNav"];
    for (var i = 0; i < list1.length; i++) {
      var elements = document.getElementsByClassName(list1[i]);
      for(var j = 0, length = elements.length; j < length; j++) {
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

    for (var i = 1; i <= numSequences; i++) {
      closeSeqNav(i);
    }
    //closeSeqNav(2);
  }
  else if (n==2) {
    document.getElementById("step2Nav").style.width = "0";
    document.getElementById("step2").style.background = sideNavColor;
    closeToolNav(1);
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
  for (var i = 1; i <= numSequences; i++) {
    var curSeqNav = "seqNav" + i;
    document.getElementById(curSeqNav).style.width = "0em";
  }
  var selectedNav = "seqNav" + n;
  document.getElementById(selectedNav).style.width = "12em";

  for (var i = 1; i <= numSequences; i++) {
    var curSeq = "seq" + i;
    if (i == n) {
      document.getElementById(curSeq).style.background = logoColor;
    }
    else {
      document.getElementById(curSeq).style.background = sideNavColor2;
    }
  }

  for (var i = 1; i <= numSequences; i++) {
    for (var j = 1; j <= 4; j++) {
      closeSeqInputNav(i,j);
    }
  }
}
function closeSeqNav(n){
  var selectedNav = "seqNav" + n;
  document.getElementById(selectedNav).style.width = "0";
  for (var i = 1; i <= numSequences; i++) {
    var curSeq = "seq" + i;
    document.getElementById(curSeq).style.background = sideNavColor2;
  }
  for (var i = 1; i <= numSequences; i++) {
    for (var j = 1; j <= 4; j++) {
      closeSeqInputNav(i,j);
    }
  }
}

function openSeqInputNav(n,m){
  if (m==1) {
    let f = "builtInInputNav" + n;
    document.getElementById(f).style.width = "24em";
    let g = "builtIn" + n;
    document.getElementById(g).style.background = topBarColor;

    var linRecNumber = "builtInSelect" + n;
    var linRecNav = "linRecNav" + n;
    if (document.getElementById(linRecNumber).value == "linRec") {
      extendLinRec(n);
    }

    closeSeqInputNav(n,m=2);
    closeSeqInputNav(n,m=3);
    closeSeqInputNav(n,m=4);
  }
  else if (m==2) {
    let f = "oeisInputNav" + n;
    document.getElementById(f).style.width = "12em";
    let g = "OEIS" + n;
    document.getElementById(g).style.background = topBarColor;
    closeSeqInputNav(n,m=1);
    closeSeqInputNav(n,m=3);
    closeSeqInputNav(n,m=4);
  }
  else if (m==3) {
    let f = "listInputNav" + n;
    document.getElementById(f).style.width = "24em";
    let g = "list" + n
    document.getElementById(g).style.background = topBarColor;
    closeSeqInputNav(n,m=1);
    closeSeqInputNav(n,m=2);
    closeSeqInputNav(n,m=4);
  }
  else if (m==4) {
    let f = "codeInputNav" + n;
    document.getElementById(f).style.width = "24em";
    let g = "code" + n;
    document.getElementById(g).style.background = topBarColor;
    closeSeqInputNav(n,m=1);
    closeSeqInputNav(n,m=2);
    closeSeqInputNav(n,m=3);
  }
}
function closeSeqInputNav(n,m){
  if (m==1) {
    let f = "builtInInputNav" + n;
    document.getElementById(f).style.width = "0";
    let g = "builtIn" + n;
    document.getElementById(g).style.background = logoColor;
    var linRecNav = "linRecNav" + n;
    document.getElementById(linRecNav).style.height = "0em";
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
var linRecHeights = ["8.5em", "11.5em", "14em", "16.5em", "19.5em", "22em", "24.7em", "27.5em", "30em", "34em" ]
function openLinRec(n){
  var linRecNumber = "builtInSelect" + n;
  var linRecNav = "linRecNav" + n;
  if (document.getElementById(linRecNumber).value == "linRec") {
    var curkSelect = "kSelect" + n;
    var linRecNavLength = document.getElementById(curkSelect).value;
    var linRecNavLength = parseInt(linRecNavLength, 10) - 1;
    var newHeight = linRecHeights[linRecNavLength];
    document.getElementById(linRecNav).style.height = newHeight;
  }
  else {
    document.getElementById(linRecNav).style.height = "0";
  }
}
function extendLinRec(n){
  var linRecNav = "linRecNav" + n;
  var curkSelect = "kSelect" + n;
  var linRecNavLength = document.getElementById(curkSelect).value;
  var linRecNavLength = parseInt(linRecNavLength, 10) - 1;
  var newHeight = linRecHeights[linRecNavLength];
  document.getElementById(linRecNav).style.height = newHeight;
}

//Tool Navigation Bars
function openToolNav(n){
  document.getElementById("toolNav").style.width = "12em";
  for (var i = 1; i <= numTools; i++) {
    var curTool = "tool" + i;
    if (i == n) {
      document.getElementById(curTool).style.background = logoColor;
    }
    else {
      document.getElementById(curTool).style.background = sideNavColor2;
    }
  }
}
function closeToolNav(n){
  if (n==1) {
    //document.getElementById("toolNav").style.marginLeft = "-12em";
    document.getElementById("toolNav").style.width = "0";
    for (var i = 1; i <= numTools; i++) {
      var curTool = "tool" + i;
      document.getElementById(curTool).style.background = sideNavColor2;
    }
  }
}

function addSeq(){
  if(numSequences < 10){
    var seqLetter = String.fromCharCode(97 + numSequences);
    numSequences += 1;

    var a = document.createElement('a');
    a.innerHTML = "{" + seqLetter + "<sub>n</sub>}";
    a.setAttribute("href", "#");

    var idName = "seq" + numSequences;
    a.setAttribute("id", idName);

    var fctCall = "openSeqNav(n=" + numSequences + ")";
    a.setAttribute("onclick", fctCall);

    document.getElementById("step1Nav").append(a);
    ////////////////////////////////
    for (var i = 1; i <= numDraw; i++) {
      var opt = document.createElement("option");
      opt.innerHTML = "{" + seqLetter + "<sub>n</sub>}";

      var valueName = "s" + numSequences;
      opt.setAttribute("value", valueName);

      var curSelect = "selectSeq" + i;
      document.getElementById(curSelect).append(opt);
    }
    ////////////////////////////////
    //Create new Function Input Nav
    var newNav = document.createElement("div");
    var navId = "seqNav" + numSequences;
    newNav.setAttribute("id", navId);
    newNav.setAttribute("class", "selectNav");

    //Close Btn Link
    var a = document.createElement('a');
    var newId = "seqCloseBtn" + numSequences;
    a.setAttribute("id", newId);
    a.setAttribute("href", "javascript:void(0)");
    a.setAttribute("class", "selectClosebtn");
    var fctCall = "closeSeqNav(n=" + numSequences + ")";
    a.setAttribute("onclick", fctCall);
    a.innerHTML = "&#171";
    newNav.appendChild(a);

    //builtIn Link
    var builtInLink = document.createElement('a');
    var builtInId = "builtIn" + numSequences;
    builtInLink.setAttribute("id", builtInId);
    builtInLink.setAttribute("href", "#");
    fctCall = "openSeqInputNav(n=" + numSequences + ",m=1)";
    builtInLink.setAttribute("onclick", fctCall);
    builtInLink.innerHTML = "Built In";
    newNav.appendChild(builtInLink);

    //OEIS Link
    var oeisLink = document.createElement('a');
    var oeisId = "OEIS" + numSequences;
    oeisLink.setAttribute("id", oeisId);
    oeisLink.setAttribute("href", "#");
    fctCall = "openSeqInputNav(n=" + numSequences + ",m=2)";
    oeisLink.setAttribute("onclick", fctCall);
    oeisLink.innerHTML = "OEIS";
    newNav.appendChild(oeisLink);

    //List Link
    var listLink = document.createElement('a');
    var listId = "list" + numSequences;
    listLink.setAttribute("id", listId);
    listLink.setAttribute("href", "#");
    fctCall = "openSeqInputNav(n=" + numSequences + ",m=3)";
    listLink.setAttribute("onclick", fctCall);
    listLink.innerHTML = "List";
    newNav.appendChild(listLink);

    //Code Link
    var codeLink = document.createElement('a');
    var codeId = "code" + numSequences;
    codeLink.setAttribute("id", codeId);
    codeLink.setAttribute("href", "#");
    fctCall = "openSeqInputNav(n=" + numSequences + ",m=4)";
    codeLink.setAttribute("onclick", fctCall);
    codeLink.innerHTML = "Sage Code";
    newNav.appendChild(codeLink);

    document.getElementById("seqNavs").append(newNav);
    ///////////////////////////////////////////////
    //Create Function Input Nav
    var newNav = document.createElement("div");
    newId = "builtInInputNav" + numSequences;
    newNav.setAttribute("id", newId);
    newNav.setAttribute("class", "seqInputNav");

    var a = document.createElement('a');
    var closeId = "builtInCloseBtn" + numSequences;
    a.setAttribute("id", closeId);
    a.setAttribute("href", "javascript:void(0)");
    a.setAttribute("class", "closebtn");
    fctCall = "closeSeqInputNav(n=" + numSequences + ",m=1)";
    a.setAttribute("onclick", fctCall);
    a.innerHTML = "&#171";
    newNav.appendChild(a);

    document.getElementById("builtInInputNavs").append(newNav);

    //Create OEIS Input Nav
    var newNav = document.createElement("div");
    newId = "oeisInputNav" + numSequences;
    newNav.setAttribute("id", newId);
    newNav.setAttribute("class", "seqInputNav");

    var a = document.createElement('a');
    var closeId = "oeisCloseBtn" + numSequences;
    a.setAttribute("id", closeId);
    a.setAttribute("href", "javascript:void(0)");
    a.setAttribute("class", "closebtn");
    fctCall = "closeSeqInputNav(n=" + numSequences + ",m=2)";
    a.setAttribute("onclick", fctCall);
    a.innerHTML = "&#171";
    newNav.appendChild(a);

    var newli = document.createElement("li");
    newli.innerHTML = "OEIS Number: ";
    newNav.appendChild(newli);

    var newText = document.createElement("textarea");
    newId = "oeisNum" + numSequences;
    newText.setAttribute("id", newId);
    newText.setAttribute("class", "oeisNum");
    newNav.appendChild(newText);

    document.getElementById("oeisInputNavs").append(newNav);

    //Create List Input Nav
    var newNav = document.createElement("div");
    newId = "listInputNav" + numSequences;
    newNav.setAttribute("id", newId);
    newNav.setAttribute("class", "seqInputNav");

    var a = document.createElement('a');
    var closeId = "listCloseBtn" + numSequences;
    a.setAttribute("id", closeId);
    a.setAttribute("href", "javascript:void(0)");
    a.setAttribute("class", "closebtn");
    fctCall = "closeSeqInputNav(n=" + numSequences + ",m=3)";
    a.setAttribute("onclick", fctCall);
    a.innerHTML = "&#171";
    newNav.appendChild(a);

    document.getElementById("listInputNavs").append(newNav);

    //Create Code Input Nav
    var newNav = document.createElement("div");
    newId = "codeInputNav" + numSequences;
    newNav.setAttribute("id", newId);
    newNav.setAttribute("class", "seqInputNav");

    var a = document.createElement('a');
    var closeId = "codeCloseBtn" + numSequences;
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
    var toolNum = numTools + 1;
    numTools += 1;

    var a = document.createElement('a');
    a.innerHTML = "Tool " + toolNum;
    a.setAttribute("href", "#");

    var idName = "tool" + numTools;
    a.setAttribute("id", idName);

    var fctCall = "openToolNav(n=" + numTools + ")";
    a.setAttribute("onclick", fctCall);

    document.getElementById("step2Nav").append(a);
    ////////////////////////////////
    for (var i = 1; i <= numDraw; i++) {
      var opt = document.createElement("option");
      opt.innerHTML = "Tool " + numTools;

      var valueName = "t" + numTools;
      opt.setAttribute("value", valueName);

      var curSelect = "selectTool" + i;
      document.getElementById(curSelect).append(opt);
    }
  }
}
function addDraw(){
  if(numDraw < 10){
    numDraw += 1;
    /////////////////////////////////////
    var a = document.createElement('a');
    a.innerHTML = numDraw + ".";
    a.setAttribute("href", "#");
    a.setAttribute("class", "numColumn");
    document.getElementById("drawListNum").append(a);
    /////////////////////////////////////
    var sel = document.createElement("select");
    var selIDName = "selectSeq" + numDraw;
    sel.setAttribute("id", selIDName);
    document.getElementById("drawSeqList").append(sel);

    for (var i = 1; i <= numSequences; i++) {
      var j = 97 + (i - 1);
      var seqLetter = String.fromCharCode(j);
      var opt = document.createElement("option");
      opt.innerHTML = "{" + seqLetter + "<sub>n</sub>}";

      var valueName = "s" + i;
      opt.setAttribute("value", valueName);

      document.getElementById(selIDName).append(opt);
    }
    /////////////////////////////////////
    var sel = document.createElement("select");
    var selIDName = "selectTool" + numDraw;
    sel.setAttribute("id", selIDName);
    document.getElementById("drawToolList").append(sel);

    for (var i = 1; i <= numTools; i++) {
      var seqLetter = String.fromCharCode(j);
      var opt = document.createElement("option");
      opt.innerHTML = "Tool " + i;

      var valueName = "t" + i;
      opt.setAttribute("value", valueName);

      document.getElementById(selIDName).append(opt);
    }
    // /////////////////////////////////////
    var a = document.createElement('a');
    a.innerHTML = "&times";
    a.setAttribute("href", "#");
    a.setAttribute("class", "xColumn");

    document.getElementById("drawRemoveBtns").append(a);
  }
}
