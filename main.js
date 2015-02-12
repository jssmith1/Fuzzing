var test = require('tap').test,
    //fuzzer = require('fuzzer'),
    Random = require('random-js')
    marqdown = require('./marqdown.js'),
    fs = require('fs'),
    //stackTrace = require('stack-trace')
    stackTrace = require('stacktrace-parser')
    ;

var fuzzer = 
{
    random : new Random(Random.engines.mt19937().seed(0)),
    
    seed: function (kernel)
    {
        fuzzer.random = new Random(Random.engines.mt19937().seed(kernel));
    },

    mutate:
    {
        string: function(val)
        {
        	do{
            // MUTATE IMPLEMENTATION HERE
            var array = val.split('');

            if( fuzzer.random.bool(0.05) )
            {
            	//Reverse Input
            	array.reverse();
            }
            
            if(fuzzer.random.bool(0.25))
            {
            	//Remove random set of characters
            	array.splice(fuzzer.random.integer(0, array.length), fuzzer.random.integer(0, array.length));
            }
            if(fuzzer.random.bool(0.25)){
            	//Insert 10 random characters
            	var randString = fuzzer.random.string(10);
            	var randArray = randString.split('');
            	array.splice.apply(array, [array.length -1, 0].concat(randArray));
            }
        	}
        	while(fuzzer.random.bool(.05)) //Maybe Repeat
            return array.join('');
        }
    }
};

fuzzer.seed(0);

var failedTests = [];
var reducedTests = [];
var passedTests = 0;

function mutationTesting()
{
    var markDown = fs.readFileSync('test.md','utf-8');
    var markDownSimple = fs.readFileSync('simple.md','utf-8');
    
    
    for (var i = 0; i < 1000; i++) {

    	var mutuatedString;
    	if (i % 2 == 0){
    		mutuatedString = fuzzer.mutate.string(markDown);
    	}
    	else{
    		mutuatedString = fuzzer.mutate.string(markDownSimple);

    	}
        try
        {
            marqdown.render(mutuatedString);
            passedTests++;
        }
        catch(e)
        {
            failedTests.push( {input:mutuatedString, stack: e.stack} );
        }
    }

    
    // RESULTS OF FUZZING
    for( var i =0; i < failedTests.length; i++ )
    {
        var failed = failedTests[i];

        var trace = stackTrace.parse( failed.stack );
        var msg = failed.stack.split("\n")[0];
        
        var skip = false;
        for (tst in reducedTests){
        	console.log(JSON.stringify(tst) + "/n");
        	if((tst.line == trace[0].lineNumber) && (tst.method == trace[0].methodName)){
        		console.log("HERE");
        		skip = true;
        	}
        }
        
        if (!skip){
        	reducedTests.push({
        		line: trace[0].lineNumber,
        		method: trace[0].methodName
        	})
        	console.log( msg, trace[0].methodName, trace[0].lineNumber );
        }

    }

    console.log( "passed {0}, failed {1}, reduced {2}".format(passedTests, failedTests.length, reducedTests.length) );

}

mutationTesting();

//test('markedMutation', function(t) {
//
//});


if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}