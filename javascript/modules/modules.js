



// moduleFiles = ['javascript/modules/moduleShiftCompare.js','javascript/modules/moduleTurtle.js'] //Files to be loaded
// loadjs(moduleFiles, 'modulesLoaded')
// loadjs.ready('modulesLoaded', function(){
//   //at tihs point, all the files are loaded and the modules are in view
//   MODULES_JSON = {
//       "turtle": Turtle_MODULE,
//       "shiftCompare": ShiftCompare_MODULE
//   }
//   // NScore.modules = MODULES_JSON
//   NScore.SETMODULES(MODULES_JSON)
// })


import Turtle_MODULE from './moduleTurtle.js'
import ShiftCompare_MODULE from './moduleShiftCompare.js'


const MODULES_JSON = {
    "turtle": Turtle_MODULE,
    "shiftCompare": ShiftCompare_MODULE
}
export default MODULES_JSON
