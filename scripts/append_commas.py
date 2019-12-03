import sys



if __name__ == "__main__":

    if( len(sys.argv) < 2):
        print("Usage: python3 append_commas.py [javascript file]")
        sys.exit();
    filename = sys.argv[1]
    import re

    #display out put line by line
    import subprocess
    proc = subprocess.Popen(['jshint', filename],stdout=subprocess.PIPE)
    #works in python 3.0+
    #for line in proc.stdout:

    patt = re.compile("line (\d+).+Missing")
    # for line in str(proc.stdout.read(),encoding="utf-8").split("\n"):
    #     # print(line)
    match = re.findall( patt, str(proc.stdout.read(),encoding="utf-8") )
    with open(filename, "r") as file:
        source = file.read()
            
    source = source.split("\n")
    for lineNo in match:
        source[int(lineNo) - 1] += ";"
    
    source = "\n".join(source)
    # print(match)
    # print(source)
    with open(filename, "w+") as file:
        file.write( source )