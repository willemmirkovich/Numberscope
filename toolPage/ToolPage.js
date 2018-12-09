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
    document.getElementById("step1").style.background = '#087e8b';
    closeNav(n=2);
    closeNav(n=3);
  }
  else if (n == 2) {
    document.getElementById("title1").innerHTML = "Pick a Visualization Tool";
    document.getElementById("step2Nav").style.width = "12em";
    document.getElementById("step2").style.background = '#087e8b';
    closeNav(n=1);
    closeNav(n=3);
  }
  else if (n == 3) {
    document.getElementById("title1").innerHTML = "Pick Sequence to Draw";
    document.getElementById("step3Nav").style.width = "24em";
    document.getElementById("step3").style.background = '#087e8b';
    //document.getElementsByTagName('body').style.backgroundImage = "sequenceDraw.jpg";
    closeNav(n=1);
    closeNav(n=2);
  }
}
function closeNav(n){
  if (n==1) {
    document.getElementById("step1Nav").style.width = "0";
    document.getElementById("step1").style.background = '#0b5563';
    closeSeqNav(n=1);
  }
  else if (n==2) {
    document.getElementById("step2Nav").style.width = "0";
    document.getElementById("step2").style.background = '#0b5563';
    closeToolNav(n=1);
  }
  else if (n==3) {
    document.getElementById("step3Nav").style.width = "0";
    document.getElementById("step3").style.background = '#0b5563';
  }
}

function openCanvas(){
  closeNav(n=3);
  document.getElementById("mainCanvas").style.width = "100%";
}

//Sequence Navigation Bars
function openSeqNav(n){
  if (n==1) {
    //document.getElementById("seqNav").style.marginLeft = "0em";
    document.getElementById("title1").innerHTML = "Pick an Input Method";
    document.getElementById("seqNav").style.width = "12em";
    document.getElementById("seq1").style.background = '#c6a0ed';
  }
}
function closeSeqNav(n){
  if (n==1) {
    //document.getElementById("seqNav").style.marginLeft = "-12em";
    document.getElementById("seqNav").style.width = "0";
    document.getElementById("seq1").style.background = '#087e8b';
    closeSeqInputNav(n=1);
    closeSeqInputNav(n=2);
    closeSeqInputNav(n=3);
    closeSeqInputNav(n=4);
  }
}

function openSeqInputNav(n){
  if (n==1) {
    document.getElementById("fctInputNav").style.width = "24em";
    document.getElementById("fct").style.background = "#696773";
    closeSeqInputNav(2);
    closeSeqInputNav(3);
    closeSeqInputNav(4);
  }
  else if (n==2) {
    document.getElementById("oeisInputNav").style.width = "12em";
    document.getElementById("OEIS").style.background = "#696773";
    closeSeqInputNav(1);
    closeSeqInputNav(3);
    closeSeqInputNav(4);
  }
  else if (n==3) {
    document.getElementById("listInputNav").style.width = "24em";
    document.getElementById("list").style.background = "#696773";
    closeSeqInputNav(1);
    closeSeqInputNav(2);
    closeSeqInputNav(4);
  }
  else if (n==4) {
    document.getElementById("codeInputNav").style.width = "24em";
    document.getElementById("code").style.background = "#696773";
    closeSeqInputNav(1);
    closeSeqInputNav(2);
    closeSeqInputNav(3);
  }
}
function closeSeqInputNav(n){
  if (n==1) {
    document.getElementById("fctInputNav").style.width = "0";
    document.getElementById("fct").style.background = "#c6a0ed";
  }
  else if (n==2) {
    document.getElementById("oeisInputNav").style.width = "0";
    document.getElementById("OEIS").style.background = "#c6a0ed";
  }
  else if (n==3) {
    document.getElementById("listInputNav").style.width = "0";
    document.getElementById("list").style.background = "#c6a0ed";
  }
  else if (n==4) {
    document.getElementById("codeInputNav").style.width = "0";
    document.getElementById("code").style.background = "#c6a0ed";
  }
}

//Tool Navigation Bars
function openToolNav(n){
  if (n==1) {
    //document.getElementById("toolNav").style.marginLeft = "0em";
    document.getElementById("toolNav").style.width = "12em";
    document.getElementById("tool1").style.background = '#c6a0ed';
  }
}
function closeToolNav(n){
  if (n==1) {
    //document.getElementById("toolNav").style.marginLeft = "-12em";
    document.getElementById("toolNav").style.width = "0";
    document.getElementById("tool1").style.background = '#087e8b';
  }
}
