var logoColor = "#afafdc";
var topBarColor = "#f75c03";
var sideNavColor = "#416788";
var sideNavColor2 = "#70cad1";
var numSequences = 0;
var numTools = 0;
var numDraw = 0;
const inputTypesNames = ["builtIn", "OEIS", "list", "code"]
// const moduleKeys = ["empty", "turtle", "gameOfLife", "shiftCompare"]

const moduleKeys = Object.keys(NScore.modules);
const moduleNames = moduleKeys.map((key) => NScore.modules[key].name)
const seqKeys = Object.keys(NScore.BuiltInSeqs)

var currentSequence = {
  ID: undefined,
  inputType: undefined,
  inputValue: undefined,
  parameters: {},
  setID: function (n) {
    this.ID = n;
  },
  setType: function (m) {
    this.inputType = inputTypesNames[m - 1];
  },
  setValue: function () {
    if (this.inputType == "builtIn") {
      this.inputValue = document.getElementById(this.inputType + "Select" + this.ID).value
    }
    if (this.inputType == "OEIS") {
      this.inputValue = document.getElementById("oeisNum" + this.ID).value;
    }
    if (this.inputType == "list") {
      this.inputValue = "[" + document.getElementById("listText" + this.ID).value + "]";
    }
    if (this.inputType == "code") {
      console.error("Not Implemented: " + this.inputType + " input")
      // this.inputValue = document.getElementById("codeText" + this.ID);
    }
  },
  setParameters: function () {
    if (this.inputType == "builtIn") {
      let currentForm = "#" + this.inputValue + "Params" + "Form" + this.ID
      let collectedParameters = $(currentForm).serializeArray();
      collectedParameters.forEach(
        (formField) => this.parameters[formField.name] = formField.value
      )
    }
  },
  sendSequence: function () {
    if (this.inputValue == undefined) {
      console.log("Not setting input since it is undefined for input type: " + this.inputType)
    } else {
      NScore.receiveSequence(Object.assign({}, {
        ID: this.ID,
        inputType: this.inputType,
        inputValue: this.inputValue,
        parameters: this.parameters
      }))
    }
  },
  refresh: function () {
    this.ID = undefined;
    this.inputType = undefined;
    this.inputValue = undefined;
    this.parameters = {};
  }
}


// Same principle as above
var currentTool = {
  ID: undefined,
  moduleKey: undefined,
  config: {},
  setID: function (n) {
    this.ID = n;
  },
  setModule: function (m) {
    this.moduleKey = moduleKeys[m];
    //this config is temporary
  },
  setConfig: function (config) {
    let configID = "#" + this.moduleKey + "Config" + this.ID;
    console.log("config id: ")
    console.log(configID)
    let collectedConfig = $(configID).serializeArray()
    collectedConfig.forEach(
      (configField) => this.config[configField.name] = configField.value
    )
    console.log("config: ")
    console.log(this.config);
    // console.log("Not implemented");
  },
  sendModule: function () {

    // Pass to NScore, gets a return value that might be a possible error

    console.log("Sending module: " + this.moduleKey)
    NScore.receiveModule(Object.assign({}, {
      ID: this.ID,
      moduleKey: this.moduleKey,
      config: this.config
    }))
  },
  refresh: function () {
    this.ID = undefined;
    this.moduleKey = undefined;
    this.config = {};
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
    for (let j = 0, length = elements.length; j < length; j++) {
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
    for (let j = 0, length = elements.length; j < length; j++) {
      elements[j].style.marginLeft = "0em";
    }
  }
}

function openNav(n) {
  if (n == 1) {
    document.getElementById("title1").innerHTML = "Pick an Integer Sequence";
    document.getElementById("step1Nav").style.width = "12em";
    document.getElementById("step1").style.background = sideNavColor2;
    closeNav(2);
    closeNav(3);
  } else if (n == 2) {
    document.getElementById("title1").innerHTML = "Pick a Visualization Tool";
    document.getElementById("step2Nav").style.width = "12em";
    document.getElementById("step2").style.background = sideNavColor2;
    closeNav(1);
    closeNav(3);
  } else if (n == 3) {
    document.getElementById("title1").innerHTML = "Pick Sequence to Draw";
    document.getElementById("step3Nav").style.width = "36em";
    document.getElementById("step3").style.background = sideNavColor2;
    //document.getElementsByTagName('body').style.backgroundImage = "sequenceDraw.jpg";
    closeNav(1);
    closeNav(2);
  }
}

function closeNav(n) {
  if (n == 1) {
    document.getElementById("step1Nav").style.width = "0";
    document.getElementById("step1").style.background = sideNavColor;

    for (let k = 1; k <= numSequences; k++) {
      closeSeqNav(k);
    }
  } else if (n == 2) {
    document.getElementById("step2Nav").style.width = "0";
    document.getElementById("step2").style.background = sideNavColor;
    for (let k = 1; k <= numTools; k++) {
      closeToolNav(k);
    }
  } else if (n == 3) {
    document.getElementById("step3Nav").style.width = "0";
    document.getElementById("step3").style.background = sideNavColor;
  }
}

//Sequence Navigation Bars
function openSeqNav(n) {
  if (currentSequence.inputType != undefined) {
    currentSequence.setValue();
    currentSequence.setParameters();
    currentSequence.sendSequence();
  }
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
    } else {
      document.getElementById(curSeq).style.background = sideNavColor2;
    }
  }

  for (let i = 1; i <= numSequences; i++) {
    for (let j = 1; j <= 4; j++) {
      closeSeqInputNav(i, j);
    }
  }
}

function closeSeqNav(n) {
  //selection is considered finalized here
  //if statement causes bug when Linear Recurrence Option is selected
  if (currentSequence.inputType != undefined) {
    currentSequence.setValue();
    currentSequence.setParameters(); //this temp, should get it from input box or something
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
      closeSeqInputNav(i, j);
    }
  }
}

function openSeqInputNav(n, m) {
  currentSequence.setType(m);
  if (m == 1) {
    let u = "builtInInputNav" + n;
    document.getElementById(u).style.width = "24em";
    document.getElementById(u).style.padding = "8px";
    let v = "builtIn" + n;
    document.getElementById(v).style.background = topBarColor;
    document.getElementById(v).style.borderColor = topBarColor;
    document.getElementById(v).style.borderLeftColor = sideNavColor;

    showBuiltInParams(n);
    //attach correct form to u
    // console.log(NScore.BuiltInSeqs[seqKeys[m]].params)
    // $('#seqform1').jsonForm({
    //   schema: {
    //     MOD: {
    //       type: 'number',
    //       title: 'mod',
    //       required: true
    //     },
    //     STUFF: {
    //       type: 'number',
    //       title: 'stuff1'
    //     },
    //     STUFF2: {
    //       type: 'number',
    //       title: 'stuff2'
    //     },
    //     BG_COLOR: {
    //       type: 'string',
    //       title: 'background color',
    //       format: 'color'
    //     },
    //     STROKE_COLOR: {
    //       type: 'string',
    //       title: 'Line color',
    //       format: 'color'
    //     }
    //   },
    //   onSubmit: function (errors, values) {
    //     if (errors) {
    //       console.log("ERROR")
    //     } else {
    //       console.log("Resulting object: ")
    //       console.log(values)
    //     }
    //   }
    // });

    document.getElementById("OEIS" + n).style.borderLeftColor = logoColor;
    document.getElementById("list" + n).style.borderLeftColor = logoColor;
    document.getElementById("code" + n).style.borderLeftColor = logoColor;

    closeSeqInputNav(n, 3);
    closeSeqInputNav(n, 4);
    closeSeqInputNav(n, 2);
  } else if (m == 2) {
    let u = "oeisInputNav" + n;
    document.getElementById(u).style.width = "12em";
    let v = "OEIS" + n;
    document.getElementById(v).style.background = topBarColor;
    document.getElementById(v).style.borderColor = topBarColor;
    document.getElementById(v).style.borderLeftColor = sideNavColor;

    document.getElementById("builtIn" + n).style.borderLeftColor = logoColor;
    document.getElementById("list" + n).style.borderLeftColor = logoColor;
    document.getElementById("code" + n).style.borderLeftColor = logoColor;

    closeSeqInputNav(n, 4);
    closeSeqInputNav(n, 3);
    closeSeqInputNav(n, 1);
  } else if (m == 3) {
    let u = "listInputNav" + n;
    document.getElementById(u).style.width = "24em";
    let v = "list" + n
    document.getElementById(v).style.background = topBarColor;
    document.getElementById(v).style.borderColor = topBarColor;
    document.getElementById(v).style.borderLeftColor = sideNavColor;

    document.getElementById("builtIn" + n).style.borderLeftColor = logoColor;
    document.getElementById("OEIS" + n).style.borderLeftColor = logoColor;
    document.getElementById("code" + n).style.borderLeftColor = logoColor;

    closeSeqInputNav(n, 4);
    closeSeqInputNav(n, 2);
    closeSeqInputNav(n, 1);
  } else if (m == 4) {
    let u = "codeInputNav" + n;
    document.getElementById(u).style.width = "24em";
    let v = "code" + n;
    document.getElementById(v).style.background = topBarColor;
    document.getElementById(v).style.borderColor = topBarColor;
    document.getElementById(v).style.borderLeftColor = sideNavColor;

    document.getElementById("builtIn" + n).style.borderLeftColor = logoColor;
    document.getElementById("OEIS" + n).style.borderLeftColor = logoColor;
    document.getElementById("list" + n).style.borderLeftColor = logoColor;

    closeSeqInputNav(n, 3);
    closeSeqInputNav(n, 2);
    closeSeqInputNav(n, 1);
  }
}

function closeSeqInputNav(n, m) {
  if (m == 1) {
    var f = "builtInInputNav" + n;
    var g = "builtIn" + n;
  } else if (m == 2) {
    var f = "oeisInputNav" + n;
    var g = "OEIS" + n;
  } else if (m == 3) {
    var f = "listInputNav" + n;
    var g = "list" + n;
  } else if (m == 4) {
    var f = "codeInputNav" + n;
    var g = "code" + n;
  }
  document.getElementById(f).style.width = "0";
  document.getElementById(f).style.padding = "0";
  document.getElementById(g).style.background = logoColor;
  document.getElementById(g).style.borderRightColor = logoColor;
  document.getElementById(g).style.borderTopColor = logoColor;
  document.getElementById(g).style.borderBottomColor = logoColor;
}

//Linear Recurrence
function showBuiltInParams(n) {
  let builtInSeqIndex = "builtInSelect" + n;
  let choice = $("#" + builtInSeqIndex + " :selected").val();
  let form = $("#" + choice + "ParamsForm" + n);
  form.show();
  seqKeys.forEach(
    function (key) {
      if (key != choice) {
        closeBuiltInParams(n, key)
      }
    }
  )
  // Open form belonging to sequence
}

function closeBuiltInParams(n, key) {
  let form = $("#" + key + "ParamsForm" + n);
  form.hide();
}

function extendLinRec(n) {
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
    } else {
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
function openToolNav(n) {
  for (let i = 1; i <= numTools; i++) {
    closeToolNav(i);
  }
  let selectedNav = "toolNav" + n;
  document.getElementById(selectedNav).style.width = "24em";

  for (let i = 1; i <= numTools; i++) {
    let curTool = "tool" + i;
    if (i == n) {
      document.getElementById(curTool).style.background = logoColor;
    } else {
      document.getElementById(curTool).style.background = sideNavColor2;
    }
  }
}

function closeToolNav(n) {
  if (currentTool.moduleKey != undefined) {
    currentTool.setConfig();
    currentTool.sendModule();
    currentTool.refresh();
  }
  let selectedNav = "toolNav" + n;
  document.getElementById(selectedNav).style.width = "0";
  for (let i = 1; i <= numTools; i++) {
    let curTool = "tool" + i;
    document.getElementById(curTool).style.background = sideNavColor2;
  }
  for (let i = 1; i <= numTools; i++) {
    for (let j = 0; j < moduleKeys.length; j++) {
      closeToolInputNav(i, j);
    }
  }
}

function openToolInputNav(n, m) {
  currentTool.setID(n);
  currentTool.setModule(m);

  let u = moduleKeys[m] + "Config" + n;
  document.getElementById(u).style.width = "24em";
  document.getElementById(u).style.padding = "8px";

  let v = moduleKeys[m] + n;
  document.getElementById(v).style.background = topBarColor;
  document.getElementById(v).style.borderColor = topBarColor;
  document.getElementById(v).style.borderLeftColor = sideNavColor;

  for (let r = 0; r < moduleKeys.length; r++) {
    if (r != m) {
      document.getElementById(moduleKeys[r] + n).style.borderLeftColor = logoColor;
      closeToolInputNav(n, r);
    }
  }
  $("#" + u).show()
}

function closeToolInputNav(n, m) {
  let u = moduleKeys[m] + "Config" + n;
  document.getElementById(u).style.width = "0";
  document.getElementById(u).style.padding = "0";
  $("#" + u).hide()


  let v = moduleKeys[m] + n;
  document.getElementById(v).style.background = logoColor;
  document.getElementById(v).style.borderRightColor = logoColor;
  document.getElementById(v).style.borderTopColor = logoColor;
  document.getElementById(v).style.borderBottomColor = logoColor;
}

//Add Functions
function addSeq() {
  if (numSequences < 10) {
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
    newNav.setAttribute("class", "seqInputNav");
    newId = "builtInInputNav" + numSequences;
    newNav.setAttribute("id", newId);

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
    fctCall = "showBuiltInParams(n=" + numSequences + ")";
    a.setAttribute("onchange", fctCall);

    // seqKeys = Object.keys(NScore.BuiltInSeqs)
    for (let q = 0; q < seqKeys.length; q++) {
      let curOption = document.createElement('option');
      curOption.setAttribute("value", seqKeys[q]);
      curOption.innerHTML = NScore.BuiltInSeqs[seqKeys[q]].name;
      if (q == 0) {
        curOption.selected = true;
      }
      a.appendChild(curOption);
    }
    newNav.appendChild(a);


    //some form class here

    seqKeys.forEach(
      function (key) {
        newForm = document.createElement("form");
        newFormId = key + "ParamsForm" + numSequences;
        newForm.setAttribute("id", newFormId)
        newNav.appendChild(newForm)
      }
    )

    // newFormId = "builtInInputForm" + numSequences;
    // newForm.setAttribute("id", newFormId)
    // $('#builtInInputForm' + numSequences).jsonForm({
    //   schema: NScore.BuiltInSeqs[seqKeys[m]].params
    // })
    // newNav.appendChild(newForm)

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
    a.setAttribute("value", "def f(n):\n\treturn n")

    newNav.appendChild(a);

    document.getElementById("codeInputNavs").append(newNav);
    seqKeys.forEach(
      function (key) {
        newFormId = key + "ParamsForm" + numSequences;
        $("#" + newFormId).jsonForm({
          schema: NScore.BuiltInSeqs[key].paramsSchema
        })
        $("#" + newFormId).hide()
      }
    )
  }
}

function addTool() {
  if (numTools < 10) {
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


      for (let j = 0; j < moduleKeys.length; j++) {
        let curLink = document.createElement('a');
        let curId = moduleKeys[j] + numTools;
        curLink.setAttribute("id", curId);
        curLink.setAttribute("href", "#");
        fctCall = "openToolInputNav(n=" + numTools + ",m=" + j + ")";
        curLink.setAttribute("onclick", fctCall);
        curLink.innerHTML = moduleNames[j];
        newNav.appendChild(curLink);

        toolInputNav = document.createElement("form");
        toolInputNav.setAttribute("class", "seqInputNav");
        newConfigId = moduleKeys[j] + "Config" + numTools;
        toolInputNav.setAttribute("id", newConfigId);

        a = document.createElement('a');
        let closeId = "ToolInputCloseBtn" + numSequences;
        a.setAttribute("id", closeId);
        a.setAttribute("href", "javascript:void(0)");
        a.setAttribute("class", "closebtn");
        fctCall = "closeToolInputNav(n=" + numTools + ",m=" + j + ")";
        a.setAttribute("onclick", fctCall);
        a.innerHTML = "&#171";
        toolInputNav.appendChild(a);

        var body = document.getElementsByTagName("body")[0];
        body.appendChild(toolInputNav);
        $("#" + newConfigId).jsonForm({
          schema: NScore.modules[moduleKeys[j]].configSchema
        })
        // $("#" + newConfigId).hide()

      }

      document.getElementById("toolNavs").append(newNav);
    }
  }
}

function addDraw() {
  if (numDraw < 10) {
    numDraw += 1;
    /////////////////////////////////////
    let a = document.createElement('a');
    a.innerHTML = numDraw + ".";
    let numDrawId = "drawNum" + numDraw;
    a.setAttribute("id", numDrawId);
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

      let valueName = i;
      opt.setAttribute("value", valueName);

      if (i == 1) {
        opt.selected = true;
      }

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

      let valueName = i;
      opt.setAttribute("value", valueName);

      if (i == 1) {
        opt.selected = true;
      }

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
function removeDraw(n) {
  if (numDraw > 1) {
    for (let w = n; w < numDraw; w++) {
      let next = w + 1;

      let curSelectSeq = "selectSeq" + w;
      let nextSelectSeq = "selectSeq" + next;

      document.getElementById(curSelectSeq).value = document.getElementById(nextSelectSeq).value;

      let curSelectTool = "selectTool" + w;
      let nextSelectTool = "selectTool" + next;

      document.getElementById(curSelectTool).value = document.getElementById(nextSelectTool).value;
    }

    let lastSelectSeqName = "selectSeq" + numDraw;
    let lastSelectSeq = document.getElementById(lastSelectSeqName);
    lastSelectSeq.parentNode.removeChild(lastSelectSeq);

    let lastSelectToolName = "selectTool" + numDraw;
    let lastSelectTool = document.getElementById(lastSelectToolName);
    lastSelectTool.parentNode.removeChild(lastSelectTool);

    let lastDrawNumName = "drawNum" + numDraw;
    let lastDrawNum = document.getElementById(lastDrawNumName);
    lastDrawNum.parentNode.removeChild(lastDrawNum);

    let lastDrawRemoveName = "drawRemove" + numDraw;
    let lastDrawRemove = document.getElementById(lastDrawRemoveName);
    lastDrawRemove.parentNode.removeChild(lastDrawRemove);

    numDraw -= 1;
  }
};

function _draw() {
  closeNav(n = 3);
  document.getElementById("canvasArea").style.width = "100%";
  document.getElementById("canvasArea").style.height = "100%";
  NScore.clear();
  let drawSeqList = document.getElementById("drawSeqList").children;
  let drawToolList = document.getElementById("drawToolList").children;
  let seqCount = drawSeqList.length;
  let seqVizPairs = [];
  for (i = 0; i < seqCount; i++) {
    seqVizPairs.push({
      seqID: drawSeqList[i].value,
      toolID: drawToolList[i].value
    });
  }
  closeNav(n = 3);
  document.getElementById("canvasArea").style.width = "100%";
  NScore.begin(seqVizPairs);
}


addDraw()
addSeq()
addTool()
openNav(1)
openSeqNav(1)
openSeqInputNav(1, 1)