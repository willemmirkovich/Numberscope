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
    closeNav(n=2);
    closeNav(n=3);
  }
  else if (n == 2) {
    document.getElementById("title1").innerHTML = "Pick a Visualization Tool";
    document.getElementById("step2Nav").style.width = "12em";
    document.getElementById("step2").style.background = sideNavColor2;
    closeNav(n=1);
    closeNav(n=3);
  }
  else if (n == 3) {
    document.getElementById("title1").innerHTML = "Pick Sequence to Draw";
    document.getElementById("step3Nav").style.width = "24em";
    document.getElementById("step3").style.background = sideNavColor2;
    //document.getElementsByTagName('body').style.backgroundImage = "sequenceDraw.jpg";
    closeNav(n=1);
    closeNav(n=2);
  }
}
function closeNav(n){
  if (n==1) {
    document.getElementById("step1Nav").style.width = "0";
    document.getElementById("step1").style.background = sideNavColor;
    closeSeqNav(n=1);
  }
  else if (n==2) {
    document.getElementById("step2Nav").style.width = "0";
    document.getElementById("step2").style.background = sideNavColor;
    closeToolNav(n=1);
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
  document.getElementById("seqNav").style.width = "12em";
  for (var i = 1; i <= numSequences; i++) {
    var curSeq = "seq" + i;
    if (i == n) {
      document.getElementById(curSeq).style.background = logoColor;
    }
    else {
      document.getElementById(curSeq).style.background = sideNavColor2;
    }
  }
}
function closeSeqNav(n){
  if (n==1) {
    document.getElementById("seqNav").style.width = "0";
    for (var i = 1; i <= numSequences; i++) {
      var curSeq = "seq" + i;
      document.getElementById(curSeq).style.background = sideNavColor2;
    }
    closeSeqInputNav(n=1);
    closeSeqInputNav(n=2);
    closeSeqInputNav(n=3);
    closeSeqInputNav(n=4);
  }
}

function openSeqInputNav(n){
  if (n==1) {
    document.getElementById("fctInputNav").style.width = "24em";
    document.getElementById("fct").style.background = topBarColor;
    closeSeqInputNav(2);
    closeSeqInputNav(3);
    closeSeqInputNav(4);
  }
  else if (n==2) {
    document.getElementById("oeisInputNav").style.width = "12em";
    document.getElementById("OEIS").style.background = topBarColor;
    closeSeqInputNav(1);
    closeSeqInputNav(3);
    closeSeqInputNav(4);
  }
  else if (n==3) {
    document.getElementById("listInputNav").style.width = "24em";
    document.getElementById("list").style.background = topBarColor;
    closeSeqInputNav(1);
    closeSeqInputNav(2);
    closeSeqInputNav(4);
  }
  else if (n==4) {
    document.getElementById("codeInputNav").style.width = "24em";
    document.getElementById("code").style.background = topBarColor;
    closeSeqInputNav(1);
    closeSeqInputNav(2);
    closeSeqInputNav(3);
  }
}
function closeSeqInputNav(n){
  if (n==1) {
    document.getElementById("fctInputNav").style.width = "0";
    document.getElementById("fct").style.background = logoColor;
  }
  else if (n==2) {
    document.getElementById("oeisInputNav").style.width = "0";
    document.getElementById("OEIS").style.background = logoColor;
  }
  else if (n==3) {
    document.getElementById("listInputNav").style.width = "0";
    document.getElementById("list").style.background = logoColor;
  }
  else if (n==4) {
    document.getElementById("codeInputNav").style.width = "0";
    document.getElementById("code").style.background = logoColor;
  }
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
  }
}
function addDraw(){
  if(numDraw < 10){
    var drawNumber = numDraw + 1;
    var a = document.createElement('a');
    var linkText = document.createTextNode(drawNumber + ".");
    a.appendChild(linkText);
    a.href = "#";
    a.class = "numColumn";
    document.getElementById("drawListNum").append(a);

    var a = document.createElement('a');
    //a.innerHTML = "{a<sub>n</sub>}";
    a.innerHTML = "{an}";
    a.href = "#";
    document.getElementById("drawSeqList").append(a);

    var a = document.createElement('a');
    var linkText = document.createTextNode("Tool 1");
    a.appendChild(linkText);
    a.href = "#";
    document.getElementById("drawToolList").append(a);

    var a = document.createElement('a');
    a.innerHTML = "&times";
    a.href = "#";
    a.class = "xColumn";
    document.getElementById("drawRemoveBtns").append(a);

    numDraw += 1;
  }
}
