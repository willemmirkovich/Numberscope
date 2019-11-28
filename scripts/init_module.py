



import os
import sys 

def print_fail(message, end = '\n'):
    sys.stderr.write('\x1b[1;31m' + message.strip() + '\x1b[0m' + end)

def print_info(message, end = '\n'):
    sys.stdout.write('\x1b[1;32m' + message.strip() + '\x1b[0m' + end)


if __name__ == "__main__":
    moduleName = input("Enter viz name: ")
    if "module" in moduleName.lower():
        moduleName.replace("module", "")

    root = '/'.join(os.path.realpath(__file__).split("/")[:-2])
    moduleName = moduleName[0].upper() + moduleName[1:]


    moduleKey = "".join(moduleName.split(" "))
    moduleFile = f"module{moduleKey}.js"
    if moduleFile in os.listdir(f"{root}/website/javascript/modules"):
        print_fail("Module with this name already exists!")
        sys.exit()

    moduleDescription = input("Enter brief module description: ")


    print_info("1. Generating source..")
    source = f'''
class VIZ_{moduleKey} {{
    constructor(seq, sketch, config){{
        this.seq = seq
        this.sketch = sketch

    }}
    setup(){{

    }}
    draw(){{

    }}
}}

const SCHEMA_{moduleKey} = {{

}}

const MODULE_{moduleKey} = {{
    viz: VIZ_{moduleKey},
    name: '{moduleName}',
    description: '',
    configSchema: SCHEMA_{moduleKey}
}}

module.exports = MODULE_{moduleKey}
    '''

    print_info(f"2. Creating file: javascript/modules/{moduleFile}")
    with open(f"{root}/website/javascript/modules/{moduleFile}","w+") as file:
        file.write(source)
    
    print_info(f"3. Adding module entry in javascript/modules/modules.js")
    with open(f"{root}/website/javascript/modules/modules.js","a") as file:
        file.write(f"\nMODULES['{moduleKey}'] = require('./{moduleFile}')\n")

    print_info("Done!")
    print_info("NOTE: If you want to delete the file from javascript/modules, don't forget to remove the corresponding lines in javascript/modules/modules.js")
