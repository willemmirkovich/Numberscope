var logoColor = "#afafdc";
var topBarColor = "#f75c03";
var sideNavColor = "#416788";
var sideNavColor2 = "#70cad1";
var numSequences = 1;
var numTools = 1;
var numDraw = 1;
var toolTypes = ["empty","turtle", "gol", "shift", "finite"];

// var activeSequences = []
// var activeTool = []

builtInNames = ["primes", "natural", "fibonacci","lucas","thueMorse","recaman","linRec"]
inputTypesNames = ["builtIn", "OEIS", "list", "code"]
moduleNames = ["turtle", "gameOfLife","shiftCompare"]

var currentSequence = {
  ID: undefined,
  inputType: undefined,
  inputValue: undefined,
  parameters: {},
  setID: function(n){
    this.ID = n;
  },
  setType: function(m){
    this.inputType =  inputTypesNames[m - 1];
  },
  setValue: function(){
    if(this.inputType == "builtIn"){
      this.inputValue = document.getElementById(this.inputType + "Select" +  this.ID).value
    }
    if(this.inputType == "OEIS"){
      this.inputValue = undefined;
      console.error("Not Implemented: " + this.inputType + " input")
    }
    if(this.inputType == "list"){
      this.inputValue = undefined;
      console.error("Not Implemented: " + this.inputType + " input")
    }
    if(this.inputType == "code"){
      this.inputValue = undefined;
      console.error("Not Implemented: " + this.inputType + " input")
    }
  },
  setParameters: function(params){
      this.parameters = params;
      console.error("Not Implemented: parameters")
  },
  sendSequence: function(){
    if(this.inputValue == undefined){ console.log("Not setting input since it is undefined for input type: " + this.inputType)}
    else{NScore.receiveSequence(Object.assign({}, {ID: this.ID, inputType: this.inputType, inputValue: this.inputValue, parameters: this.parameters}))}
  },
  refresh: function(){
    this.ID = undefined;
    this.inputType = undefined;
    this.inputValue = undefined;
    this.parameters = undefined;
  }
}

var currentTool = {
  ID: undefined,
  moduleName: undefined,
  config: undefined,
  setID: function(n){
    this.ID = n;
  },
  setModule: function(m){
    this.moduleName = moduleNames[m - 1];
    //this config is temporary
    this.config = {
      rotMap: {0: -10, 1: 30, 2: 60, 3:180},
      stepSize: 20,
      bgColor: 'gray'
    };
  },
  setConfig: function(){
    console.log("Not implemented");
  },
  sendModule: function(){
    NScore.receiveModule(Object.assign({}, {ID: this.ID, moduleName: this.moduleName, config: this.config}))
  }
};


//Example Navigation Bar
function openExNav() {
    document.getElementById("exampleNav").style.width = "12em";
    document.getElementById("title1").style.marginLeft = "4.5em";
    //document.getElementById("mainCanvas").style.marginLeft = "12em";

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
    // document.getElementById("mainCanvas").style.marginLeft = "0";

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

//Sequence Navigation Bars
function openSeqNav(n){
  currentSequence.refresh();
  currentSequence.setID(n);
  document.getElementById("title1").innerHTML = "Pick an Input Method";
  for (let i = 1; i <= numSequences; i++) {
    let curSeqNav = "seqNav" + i;
    document.getElementById(curSeqNav).style.width = "0em";
  }
  let selectedNav = "seqNav" + n;
  document.getElementById(selectedNav).style.width = "24em";

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
  //selection is considered finalized here
  if(currentSequence.setType != undefined){
    currentSequence.setValue();
    currentSequence.setParameters({m: 4}); //this temp, should get it from input box or something
    currentSequence.sendSequence();
  }
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
  currentSequence.setType(m);
  if (m==1) {
    let u = "builtInInputNav" + n;
    document.getElementById(u).style.width = "24em";
    let v = "builtIn" + n;
    document.getElementById(v).style.background = topBarColor;
    document.getElementById(v).style.borderColor = topBarColor;
    document.getElementById(v).style.borderLeftColor = sideNavColor;

    // let linRecNumber = "builtInSelect" + n;
    // let linRecNav = "linRecNav" + n;
    // if (document.getElementById(linRecNumber).value == "linRec") {
    //   extendLinRec(n);
    // }

    document.getElementById("OEIS" + n).style.borderLeftColor = logoColor;
    document.getElementById("list" + n).style.borderLeftColor = logoColor;
    document.getElementById("code" + n).style.borderLeftColor = logoColor;

    closeSeqInputNav(n,3);
    closeSeqInputNav(n,4);
    closeSeqInputNav(n,2);
  }
  else if (m==2) {
    let u = "oeisInputNav" + n;
    document.getElementById(u).style.width = "12em";
    let v = "OEIS" + n;
    document.getElementById(v).style.background = topBarColor;
    document.getElementById(v).style.borderColor = topBarColor;
    document.getElementById(v).style.borderLeftColor = sideNavColor;

    document.getElementById("builtIn" + n).style.borderLeftColor = logoColor;
    document.getElementById("list" + n).style.borderLeftColor = logoColor;
    document.getElementById("code" + n).style.borderLeftColor = logoColor;

    closeSeqInputNav(n,4);
    closeSeqInputNav(n,3);
    closeSeqInputNav(n,1);
  }
  else if (m==3) {
    let u = "listInputNav" + n;
    document.getElementById(u).style.width = "24em";
    let v = "list" + n
    document.getElementById(v).style.background = topBarColor;
    document.getElementById(v).style.borderColor = topBarColor;
    document.getElementById(v).style.borderLeftColor = sideNavColor;

    document.getElementById("builtIn" + n).style.borderLeftColor = logoColor;
    document.getElementById("OEIS" + n).style.borderLeftColor = logoColor;
    document.getElementById("code" + n).style.borderLeftColor = logoColor;

    closeSeqInputNav(n,4);
    closeSeqInputNav(n,2);
    closeSeqInputNav(n,1);
  }
  else if (m==4) {
    let u = "codeInputNav" + n;
    document.getElementById(u).style.width = "24em";
    let v = "code" + n;
    document.getElementById(v).style.background = topBarColor;
    document.getElementById(v).style.borderColor = topBarColor;
    document.getElementById(v).style.borderLeftColor = sideNavColor;

    document.getElementById("builtIn" + n).style.borderLeftColor = logoColor;
    document.getElementById("OEIS" + n).style.borderLeftColor = logoColor;
    document.getElementById("list" + n).style.borderLeftColor = logoColor;

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
    document.getElementById(g).style.borderRightColor = logoColor;
    document.getElementById(g).style.borderTopColor = logoColor;
    document.getElementById(g).style.borderBottomColor = logoColor;
  }
  else if (m==2) {
    let f = "oeisInputNav" + n;
    document.getElementById(f).style.width = "0";
    let g = "OEIS" + n;
    document.getElementById(g).style.background = logoColor;
    document.getElementById(g).style.borderRightColor = logoColor;
    document.getElementById(g).style.borderTopColor = logoColor;
    document.getElementById(g).style.borderBottomColor = logoColor;
  }
  else if (m==3) {
    let f = "listInputNav" + n;
    document.getElementById(f).style.width = "0";
    let g = "list" + n;
    document.getElementById(g).style.background = logoColor;
    document.getElementById(g).style.borderRightColor = logoColor;
    document.getElementById(g).style.borderTopColor = logoColor;
    document.getElementById(g).style.borderBottomColor = logoColor;
  }
  else if (m==4) {
    let f = "codeInputNav" + n;
    document.getElementById(f).style.width = "0";
    let g = "code" + n;
    document.getElementById(g).style.background = logoColor;
    document.getElementById(g).style.borderRightColor = logoColor;
    document.getElementById(g).style.borderTopColor = logoColor;
    document.getElementById(g).style.borderBottomColor = logoColor;
  }
}

//Linear Recurrence
function openLinRec(n){
  let linRecNumber = "builtInSelect" + n;
  let curLinRecDef = "linRecDef" + n;
  let curKLabel = "kLabel" + n;
  let curKSelect = "kSelect" + n;
  let curCTextCol = "cTextCol" + n;
  let curATextCol = "aTextCol" + n;

  let curCList = "";
  let curCText = "";
  let curAList = "";
  let curAText = "";

  if (document.getElementById(linRecNumber).value == "linRec") {
    document.getElementById(curLinRecDef).style.fontSize = "2em";
    document.getElementById(curLinRecDef).style.opacity = "1";
    document.getElementById(curKLabel).style.opacity = "1";
    document.getElementById(curKLabel).style.visibility = "visible";
    document.getElementById(curKSelect).style.visibility = "visible";

    let numK = document.getElementById(curKSelect).value;
    for (let p = 1; p <= 10; p++) {
      curCList = "cList" + p + "_" + n;
      curCText = "cText" + p + "_" + n;
      curAList = "aList" + p + "_" + n;
      curAText = "aText" + p + "_" + n;
      if (p <= numK) {
        document.getElementById(curCList).style.fontSize = "2em";
        document.getElementById(curAList).style.fontSize = "2em";
        document.getElementById(curCList).style.opacity = "1";
        document.getElementById(curAList).style.opacity = "1";

        document.getElementById(curCText).style.opacity = "1";
        document.getElementById(curAText).style.opacity = "1";
        document.getElementById(curCText).style.visibility = "visible";
        document.getElementById(curAText).style.visibility = "visible";
      }
      else {
        document.getElementById(curCList).style.fontSize = "0";
        document.getElementById(curAList).style.fontSize = "0";
        document.getElementById(curCList).style.opacity = "0";
        document.getElementById(curAList).style.opacity = "0";

        document.getElementById(curCText).style.opacity = "0";
        document.getElementById(curAText).style.opacity = "0";
        document.getElementById(curCText).style.visibility = "hidden";
        document.getElementById(curAText).style.visibility = "hidden";
      }
    }
  }
  else {
    //// document.getElementById(curLinRecDef).style.visibility = "hidden";
    document.getElementById(curLinRecDef).style.fontSize = "0";
    document.getElementById(curLinRecDef).style.opacity = "0";
    //// document.getElementById(curKLabel).style.fontSize = "0";

    document.getElementById(curKLabel).style.opacity = "0";
    document.getElementById(curKLabel).style.visibility = "hidden";
    document.getElementById(curKSelect).style.visibility = "hidden";
    for (let p = 1; p <= 10; p++) {
      curCList = "cList" + p + "_" + n;
      curCText = "cText" + p + "_" + n;
      curAList = "aList" + p + "_" + n;
      curAText = "aText" + p + "_" + n;

      document.getElementById(curCList).style.fontSize = "0";
      document.getElementById(curAList).style.fontSize = "0";
      document.getElementById(curCList).style.opacity = "0";
      document.getElementById(curAList).style.opacity = "0";

      document.getElementById(curCText).style.opacity = "0";
      document.getElementById(curAText).style.opacity = "0";
      document.getElementById(curCText).style.visibility = "hidden";
      document.getElementById(curAText).style.visibility = "hidden";
    }
  }

  let curNatForm = "natForm" + n;
  let curNatCheck = "natCheck" + n;
  if (document.getElementById(linRecNumber).value == "natural") {
    document.getElementById(curNatForm).style.fontSize = "2em";
    document.getElementById(curNatForm).style.opacity = "1";
    document.getElementById(curNatCheck).style.opacity = "1";
    document.getElementById(curNatCheck).style.width = "1.5em";
    document.getElementById(curNatCheck).style.height = "1.5em";
  }
  else {
    document.getElementById(curNatForm).style.fontSize = "0";
    document.getElementById(curNatForm).style.opacity = "0";
    document.getElementById(curNatCheck).style.opacity = "0";
    document.getElementById(curNatCheck).style.width = "0";
    document.getElementById(curNatCheck).style.height = "0";
  }

}
function extendLinRec(n){
  let curKSelect = "kSelect" + n;

  let curCList = "";
  let curCText = "";
  let curAList = "";
  let curAText = "";

  let numK = document.getElementById(curKSelect).value;
  for (let p = 1; p <= 10; p++) {
    curCList = "cList" + p + "_" + n;
    curCText = "cText" + p + "_" + n;
    curAList = "aList" + p + "_" + n;
    curAText = "aText" + p + "_" + n;
    if (p <= numK) {
      document.getElementById(curCList).style.fontSize = "2em";
      document.getElementById(curAList).style.fontSize = "2em";
      document.getElementById(curCList).style.opacity = "1";
      document.getElementById(curAList).style.opacity = "1";

      document.getElementById(curCText).style.opacity = "1";
      document.getElementById(curAText).style.opacity = "1";
      document.getElementById(curCText).style.visibility = "visible";
      document.getElementById(curAText).style.visibility = "visible";
    }
    else {
      document.getElementById(curCList).style.fontSize = "0";
      document.getElementById(curAList).style.fontSize = "0";
      document.getElementById(curCList).style.opacity = "0";
      document.getElementById(curAList).style.opacity = "0";

      document.getElementById(curCText).style.opacity = "0";
      document.getElementById(curAText).style.opacity = "0";
      document.getElementById(curCText).style.visibility = "hidden";
      document.getElementById(curAText).style.visibility = "hidden";
    }
  }
}

//Tool Navigation Bars
function openToolNav(n){
  for (let i = 1; i <= numTools; i++) {
    // let curToolNav = "toolNav" + i;
    // document.getElementById(curToolNav).style.width = "0em";
    closeToolNav(i);
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
  for (let i = 1; i <= numTools; i++) {
    for (let j = 1; j <= 3; j++) {
      closeToolInputNav(i,j);
    }
  }
}

function openToolInputNav(n,m){
  //Tool selection is made here
  currentTool.setID(n);
  currentTool.setModule(m);
  currentTool.sendModule();

  // let v = toolTypes[m] + n;
  // document.getElementById(v).style.background = topBarColor;
  // document.getElementById(v).style.borderColor = topBarColor;
  // document.getElementById(v).style.borderLeftColor = sideNavColor;
  //
  // for (let r = 1; r < toolTypes.length; r++) {
  //   if (r != m) {
  //     document.getElementById(toolTypes[r] + n).style.borderLeftColor = logoColor;
  //     closeToolInputNav(n,r);
  //   }
  // }

  if (m==1) {
    let v = "turtle" + n;
    document.getElementById(v).style.background = topBarColor;
    document.getElementById(v).style.borderColor = topBarColor;
    document.getElementById(v).style.borderLeftColor = sideNavColor;

    document.getElementById("gol" + n).style.borderLeftColor = logoColor;
    document.getElementById("shift" + n).style.borderLeftColor = logoColor;
    document.getElementById("finite" + n).style.borderLeftColor = logoColor;

    closeToolInputNav(n,2);
    closeToolInputNav(n,3);
    closeToolInputNav(n,4);
  }
  else if (m==2) {
    let v = "gol" + n;
    document.getElementById(v).style.background = topBarColor;
    document.getElementById(v).style.borderColor = topBarColor;
    document.getElementById(v).style.borderLeftColor = sideNavColor;

    document.getElementById("turtle" + n).style.borderLeftColor = logoColor;
    document.getElementById("shift" + n).style.borderLeftColor = logoColor;
    document.getElementById("finite" + n).style.borderLeftColor = logoColor;

    closeToolInputNav(n,1);
    closeToolInputNav(n,3);
    closeToolInputNav(n,4);
  }
  else if (m==3) {
    let v = "shift" + n;
    document.getElementById(v).style.background = topBarColor;
    document.getElementById(v).style.borderColor = topBarColor;
    document.getElementById(v).style.borderLeftColor = sideNavColor;

    document.getElementById("turtle" + n).style.borderLeftColor = logoColor;
    document.getElementById("gol" + n).style.borderLeftColor = logoColor;
    document.getElementById("finite" + n).style.borderLeftColor = logoColor;

    closeToolInputNav(n,1);
    closeToolInputNav(n,2);
    closeToolInputNav(n,4);
  }
  else if (m==4) {
    let v = "finite" + n;
    document.getElementById(v).style.background = topBarColor;
    document.getElementById(v).style.borderColor = topBarColor;
    document.getElementById(v).style.borderLeftColor = sideNavColor;

    document.getElementById("turtle" + n).style.borderLeftColor = logoColor;
    document.getElementById("gol" + n).style.borderLeftColor = logoColor;
    document.getElementById("shift" + n).style.borderLeftColor = logoColor;

    closeToolInputNav(n,1);
    closeToolInputNav(n,2);
    closeToolInputNav(n,3);
  }
}
function closeToolInputNav(n,m){
  let g = toolTypes[m] + n;
  document.getElementById(g).style.background = logoColor;
  document.getElementById(g).style.borderRightColor = logoColor;
  document.getElementById(g).style.borderTopColor = logoColor;
  document.getElementById(g).style.borderBottomColor = logoColor;
}

//Add Functions
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
    builtInLink.innerHTML = "Built In Sequences";
    newNav.appendChild(builtInLink);

    //OEIS Link
    let oeisLink = document.createElement('a');
    let oeisId = "OEIS" + numSequences;
    oeisLink.setAttribute("id", oeisId);
    oeisLink.setAttribute("href", "#");
    fctCall = "openSeqInputNav(n=" + numSequences + ",m=2)";
    oeisLink.setAttribute("onclick", fctCall);
    oeisLink.innerHTML = "OEIS Number";
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
    //Create Built In Functions Input Nav
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

    //create select nav
    a = document.createElement('select');
    let selectId = "builtInSelect" + numSequences;
    a.setAttribute("id", selectId);
    fctCall = "openLinRec(n=" + numSequences + ")";
    a.setAttribute("onchange", fctCall);

    //create options
    let builtInOptions = ["primes", "natural", "fibonacci",
    "lucas", "thueMorse", "recaman", "linRec"];
    let builtInOptionNames = ["Prime Numbers", "Natural Numbers",
    "Fibonacci Numbers", "Lucas Numbers", "Thue-Morse", "Recaman", "Linear Recurrence"];

    for (let q = 0; q < builtInOptions.length; q++) {
      let curOption = document.createElement('option');
      curOption.setAttribute("value", builtInOptions[q]);
      curOption.innerHTML = builtInOptionNames[q];
      if (q==0) {
        curOption.selected = true;
      }
      a.appendChild(curOption);
    }

    newNav.appendChild(a);

    //Create Natural Number checkbox
    a = document.createElement('form');
    let formId = "natForm" + numSequences;
    a.setAttribute("id", formId);
    a.setAttribute("class", "natNumForm");

    let newNatCheck = document.createElement('input');
    let natCheckId = "natCheck" + numSequences;
    newNatCheck.setAttribute("id", natCheckId);
    newNatCheck.setAttribute("type", "checkbox");
    newNatCheck.setAttribute("value", "include0");
    a.appendChild(newNatCheck);

    let newNatLabel = document.createElement('label');
    newNatLabel.setAttribute("for", natCheckId);
    newNatLabel.innerHTML = " Include 0";
    a.appendChild(newNatLabel);

    let linebreak = document.createElement("br");
    a.appendChild(linebreak);

    newNav.appendChild(a);

    //create Linear Recurrence Nav
    a = document.createElement('li');
    let newLinRecDefId = "linRecDef" + numSequences;
    a.setAttribute("id", newLinRecDefId);
    a.setAttribute("class", "linRecDef");
    a.innerHTML = "a<sub>n</sub> = c<sub>1</sub>a<sub>n-1</sub> + ... + c<sub>k</sub>a<sub>n-k</sub>";
    newNav.appendChild(a);
    ////////////////////////////
    let newKRow = document.createElement('div');
    newKRow.setAttribute("class", "kRow");
    //
    let newKLabelDiv = document.createElement('div');
    newKLabelDiv.setAttribute("class", "kLabel");
    let kLabelLi = document.createElement('li');
    let kLabelId = "kLabel" + numSequences;
    kLabelLi.setAttribute("id", kLabelId);
    kLabelLi.innerHTML = " k =";
    newKLabelDiv.appendChild(kLabelLi);

    newKRow.appendChild(newKLabelDiv);
    //
    let newKSelectDiv = document.createElement('div');
    newKSelectDiv.setAttribute("class", "kSelect");

    let kSelect = document.createElement('select');
    let kSelectId = "kSelect" + numSequences;
    kSelect.setAttribute("id", kSelectId);
    fctCall = "extendLinRec(n=" + numSequences + ")";
    kSelect.setAttribute("onchange", fctCall);

    for (let h = 1; h <= 10 ; h++) {
      let curKOption = document.createElement('option');
      curKOption.setAttribute("value", h);
      curKOption.innerHTML = h;
      if (h==2) {
        curKOption.selected = true;
      }
      kSelect.appendChild(curKOption);
    }

    newKSelectDiv.appendChild(kSelect)

    newKRow.appendChild(newKSelectDiv);
    //
    newNav.appendChild(newKRow);
    //////////////////////////////////////
    let newLinRecDiv = document.createElement('div');
    newLinRecDiv.setAttribute("class", "linRecRow");
    //
    let newCListDiv = document.createElement('div');
    newCListDiv.setAttribute("class", "ListColumn");

    for (let aa = 1; aa <=10; aa++) {
      let curCList = document.createElement('li');
      let curCListId = "cList" + aa + "_" + numSequences;
      curCList.setAttribute("id", curCListId);
      let curCListHTML = " c<sub>" + aa + "</sub> : ";
      curCList.innerHTML = curCListHTML;
      newCListDiv.appendChild(curCList);
    }

    newLinRecDiv.appendChild(newCListDiv);
    //
    let newCTextDiv = document.createElement('div');
    newCTextDiv.setAttribute("class", "TextColumn");

    for (let ab = 1; ab <=10; ab++) {
      let curCText = document.createElement('input');
      curCText.setAttribute("type", "text");
      let curCTextId = "cText" + ab + "_" + numSequences;
      curCText.setAttribute("id", curCTextId);
      newCTextDiv.appendChild(curCText);

      let cTextlinebreak = document.createElement("br");
      newCTextDiv.appendChild(cTextlinebreak);
    }

    newLinRecDiv.appendChild(newCTextDiv);
    //
    let newAListDiv = document.createElement('div');
    newAListDiv.setAttribute("class", "ListColumn");

    for (let ac = 1; ac <=10; ac++) {
      let curAList = document.createElement('li');
      let curAListId = "aList" + ac + "_" + numSequences;
      curAList.setAttribute("id", curAListId);
      let acc = ac - 1;
      let curAListHTML = " a<sub>" + acc + "</sub> : ";
      curAList.innerHTML = curAListHTML;
      newAListDiv.appendChild(curAList);
    }

    newLinRecDiv.appendChild(newAListDiv);
    //
    let newATextDiv = document.createElement('div');
    newATextDiv.setAttribute("class", "TextColumn");

    for (let ad = 1; ad <=10; ad++) {
      let curAText = document.createElement('input');
      curAText.setAttribute("type", "text");
      let curATextId = "aText" + ad + "_" + numSequences;
      curAText.setAttribute("id", curATextId);
      newATextDiv.appendChild(curAText);

      let aTextlinebreak = document.createElement("br");
      newATextDiv.appendChild(aTextlinebreak);
    }

    newLinRecDiv.appendChild(newATextDiv);
    //
    newNav.appendChild(newLinRecDiv);
    ////////////////////////////////////////
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
    newText.setAttribute("maxlength", "7");
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

    a = document.createElement('li');
    a.innerHTML = "List:";
    newNav.appendChild(a);

    a = document.createElement('textarea');
    let listTextId = "listText" + numSequences;
    a.setAttribute("id", listTextId);
    a.setAttribute("placeholder", "1,2,3,4,5,...");
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

    a = document.createElement('li');
    a.innerHTML = "Code:";
    newNav.appendChild(a);

    a = document.createElement('textarea');
    let codeTextId = "codeText" + numSequences;
    a.setAttribute("id", codeTextId);
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

      //Finite Differences Link
      let finiteLink = document.createElement('a');
      let finiteId = "finite" + numTools;
      finiteLink.setAttribute("id", finiteId);
      finiteLink.setAttribute("href", "#");
      fctCall = "openToolInputNav(n=" + numTools + ",m=4)";
      finiteLink.setAttribute("onclick", fctCall);
      finiteLink.innerHTML = "Finite Differences";
      newNav.appendChild(finiteLink);

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
//Remove Function
function removeDraw(n){

}
function drawClicked(){
  closeNav(n=3);
  document.getElementById("canvasArea").style.width = "100%";
  document.getElementById("canvasArea").style.height = "100%";
  NScore.clearCanvasArea();
  let drawSeqList = document.getElementById("drawSeqList").children;
  let drawToolList = document.getElementById("drawToolList").children;
  let seqCount = drawSeqList.length;
  let seqVizPairs = [];
  for(i = 0; i<seqCount; i++){
    seqVizPairs.push({seqID: drawSeqList[i].value, toolID: drawToolList[i].value});
  }
  closeNav(n=3);
  document.getElementById("canvasArea").style.width = "100%";
  NScore.beginDraw(seqVizPairs);
}
