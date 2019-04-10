







const sageUtils = function(){

    this.result = null;
    
    execute_code = function(code){
        $.post('http://aleph.sagemath.org/service', "code=" + code, function (data) {
            this.result = JSON.parse(data.stdout);
        });
    }

    return {
        execute_code: execute_code
    }
}()

export default sageUtils