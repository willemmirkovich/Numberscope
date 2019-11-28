

if [ ! -f website/javascript/core/validOEIS.js ]; 
then 
    curl https://raw.githubusercontent.com/sagemath/sagelib/master/sage/combinat/sloane_functions.py |
    grep -Po "^class \K(A\d+)" |
    python3 -c "import sys,json; print('export const validOEIS = ' + json.dumps(sys.stdin.read().split('\n')[:-1]))" > "../website/javascript/validOEIS.js"
fi