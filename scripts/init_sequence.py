



import os
import sys 

def print_fail(message, end = '\n'):
    sys.stderr.write('\x1b[1;31m' + message.strip() + '\x1b[0m' + end)

def print_info(message, end = '\n'):
    sys.stdout.write('\x1b[1;32m' + message.strip() + '\x1b[0m' + end)


if __name__ == "__main__":
    seqName = input("Enter sequence name: ")
    if "sequence" in seqName.lower():
        seqName.replace("sequence", "")

    root = '/'.join(os.path.realpath(__file__).split("/")[:-2])
    seqName = seqName[0].upper() + seqName[1:]


    seqKey = "".join(seqName.split(" "))
    seqFile = f"sequence{seqKey}.js"
    if seqFile in os.listdir(f"{root}/website/javascript/sequences"):
        print_fail("Sequence with this name already exists!")
        sys.exit()

    seqDescription = input("Enter brief sequence description: ")


    print_info("1. Generating source..")
    source = f'''
function GEN_{seqKey}({{}}) {{
    const {seqKey} = function(n, cache){{
        //define your function here
    }}
    return {seqKey}
}}

const SCHEMA_{seqKey} = {{

}}

const SEQ_{seqKey} = {{
    generator: GEN_{seqKey},
    name: '{seqName}',
    description: '{seqDescription}',
    paramsSchema: SCHEMA_{seqKey}
}}

module.exports = SEQ_{seqKey}
    '''

    print_info(f"2. Creating file: javascript/sequences/{seqFile}")
    with open(f"{root}/website/javascript/sequences/{seqFile}","w+") as file:
        file.write(source)
    
    print_info(f"3. Adding sequence entry in javascript/sequences/sequences.js")
    with open(f"{root}/website/javascript/sequences/sequences.js","a") as file:
        file.write(f"\nBuiltInSeqs['{seqKey}'] = require('./{seqFile}')\n")

    print_info("Done!")
    print_info("NOTE: If you want to delete the file from javascript/sequences, don't forget to remove the corresponding lines in javascript/sequences/sequences.js")
