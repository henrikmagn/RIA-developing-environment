
// JSpec - Core - Copyright TJ Holowaychuk <tj@vision-media.ca> (MIT Licensed)

(function(){

  JSpec = {

    version   : '2.4.2',
    suites    : [],
    modules   : [],
    allSuites : [],
    matchers  : {},
    stubbed   : [],
    stats     : { specs : 0, assertions : 0, failures : 0, passes : 0, specsFinished : 0, suitesFinished : 0 },
    options   : { profile : false },

    /**
     * Default context in which bodies are evaluated.
     *
     * Replace context simply by setting JSpec.context
     * to your own like below:
     *
     * JSpec.context = { foo : 'bar' }
     *
     * Contexts can be changed within any body, this can be useful
     * in order to provide specific helper methods to specific suites.
     *
     * To reset (usually in after hook) simply set to null like below:
     *
     * JSpec.context = null
     *
     */

     defaultContext : {
      
      /**
       * Return an object used for proxy assertions. 
       * This object is used to indicate that an object
       * should be an instance of _object_, not the constructor
       * itself.
       *
       * @param  {function} constructor
       * @return {hash}
       * @api public
       */
      
      an_instance_of : function(constructor) {
        return { an_instance_of : constructor }
      }
    },

    // --- Objects
    
    formatters : {

      /**
       * Default formatter, outputting to the DOM.
       *
       * Options:
       *   - reportToId    id of element to output reports to, defaults to 'jspec'
       *   - failuresOnly  displays only suites with failing specs
       *
       * @api public
       */

      DOM : function(results, options) {
        var id = option('reportToId') || 'jspec'
        var report = document.getElementById(id)
        var failuresOnly = option('failuresOnly')
        var classes = results.stats.failures ? 'has-failures' : ''
        if (!report) throw 'JSpec requires the element #' + id + ' to output its reports'

        var markup =
        '<div id="jspec-report" class="' + classes + '"><div class="heading">           \
        <span class="passes">Passes: <em>' + results.stats.passes + '</em></span>       \
        <span class="failures">Failures: <em>' + results.stats.failures + '</em></span> \
        </div><table class="suites">'
        
        bodyContents = function(body) {
          return JSpec.
            escape(JSpec.contentsOf(body)).
            replace(/^ */gm, function(a){ return (new Array(Math.round(a.length / 3))).join(' ') }).
            replace("\n", '<br/>')
        }
        
        renderSuite = function(suite) {
          var displaySuite = failuresOnly ? suite.ran && !suite.passed() : suite.ran
          if (displaySuite && suite.hasSpecs()) {
            markup += '<tr class="description"><td colspan="2">' + suite.description + '</td></tr>'
            each(suite.specs, function(i, spec){
              markup += '<tr class="' + (i % 2 ? 'odd' : 'even') + '">'
              if (spec.requiresImplementation())
                markup += '<td class="requires-implementation" colspan="2">' + spec.description + '</td>'
              else if (spec.passed() && !failuresOnly)
                markup += '<td class="pass">' + spec.description+ '</td><td>' + spec.assertionsGraph() + '</td>'
              else if(!spec.passed())
                markup += '<td class="fail">' + spec.description + ' <em>' + spec.failure().message + '</em>' + '</td><td>' + spec.assertionsGraph() + '</td>'
              markup += '<tr class="body"><td colspan="2"><pre>' + bodyContents(spec.body) + '</pre></td></tr>'
            })
            markup += '</tr>'
          }
        }  
        
        renderSuites = function(suites) {
          each(suites, function(suite){
            renderSuite(suite)
            if (suite.hasSuites()) renderSuites(suite.suites)
          })
        }
        
        renderSuites(results.suites)
        markup += '</table></div>'
        report.innerHTML = markup
      },
      
      /**
       * Terminal formatter.
       *
       * @api public
       */
       
       Terminal : function(results, options) {
         failuresOnly = option('failuresOnly')
         print(color("\n Passes: ", 'bold') + color(results.stats.passes, 'green') + 
              color(" Failures: ", 'bold') + color(results.stats.failures, 'red') + "\n")
              
         indent = function(string) {
           return string.replace(/^(.)/gm, '  $1')
         }

         renderSuite = function(suite) {
           displaySuite = failuresOnly ? suite.ran && !suite.passed() : suite.ran
           if (displaySuite && suite.hasSpecs()) {
             print(color(' ' + suite.description, 'bold'))
             each(suite.specs, function(spec){
               var assertionsGraph = inject(spec.assertions, '', function(graph, assertion){
                 return graph + color('.', assertion.passed ? 'green' : 'red')
               })
               if (spec.requiresImplementation())
                 print(color('  ' + spec.description, 'blue') + assertionsGraph)
               else if (spec.passed() && !failuresOnly)
                 print(color('  ' + spec.description, 'green') + assertionsGraph)
               else if (!spec.passed())
                 print(color('  ' + spec.description, 'red') + assertionsGraph + 
                       "\n" + indent(spec.failure().message) + "\n")
             })
             print("")
           }          
         }

         renderSuites = function(suites) {
           each(suites, function(suite){
             renderSuite(suite)
             if (suite.hasSuites()) renderSuites(suite.suites)
           })
         }

         renderSuites(results.suites)
       },

      /**
       * Console formatter, tested with Firebug and Safari 4.
       *
       * @api public
       */

      Console : function(results, options) {
        console.log('')
        console.log('Passes: ' + results.stats.passes + ' Failures: ' + results.stats.failures)
        
        renderSuite = function(suite) {
          if (suite.ran) {
            console.group(suite.description)
            each(suite.specs, function(spec){
              var assertionCount = spec.assertions.length + ':'
              if (spec.requiresImplementation())
                console.warn(spec.description)
              else if (spec.passed())
                console.log(assertionCount + ' ' + spec.description)
              else 
                console.error(assertionCount + ' ' + spec.description + ', ' + spec.failure().message)
            })
            console.groupEnd()
          }          
        }
        
        renderSuites = function(suites) {
          each(suites, function(suite){
            renderSuite(suite)
            if (suite.hasSuites()) renderSuites(suite.suites)
          })
        }
        
        renderSuites(results.suites)
      }
    },
    
    Assertion : function(matcher, actual, expected, negate) {
      extend(this, {
        message : '',
        passed : false,
        actual : actual,
        negate : negate,
        matcher : matcher,
        expected : expected,
        
        // Report assertion results
        
        report : function() {
          this.passed ? JSpec.stats.passes++ : JSpec.stats.failures++
          return this
        },
        
        // Run the assertion
        
        run : function() {
          // TODO: remove unshifting 
          expected.unshift(actual)
          this.result = matcher.match.apply(this, expected)
          this.passed = negate ? !this.result : this.result
          if (!this.passed) this.message = matcher.message.call(this, actual, expected, negate, matcher.name)
          return this
        }
      })
    },
    
    ProxyAssertion : function(object, method, times) {
      var self = this
      var old = object[method]
      
      // Proxy
      
      object[method] = function(){
        args = argumentsToArray(arguments)
        result = old.apply(object, args)
        self.calls.push({ args : args, result : result })
        return result
      }
      
      // Times
      
      this.times = {
        'once'  : 1,
        'twice' : 2
      }[times] || times || 1
      
      // TODO: negation
      
      extend(this, {
        calls : [],
        message : '',
        defer : true,
        passed : false,
        object : object,
        method : method,
        
        // Proxy return value
        
        and_return : function(result) {
          this.expectedResult = result
          return this
        },
        
        // Proxy arguments passed
        
        with_args : function() {
          this.expectedArgs = argumentsToArray(arguments)
          return this
        },
        
        // Check if any calls have failing results
        
        anyResultsFail : function() {
          return any(this.calls, function(call){
            return self.expectedResult.an_instance_of ?
                     call.result.constructor != self.expectedResult.an_instance_of:
                       hash(self.expectedResult) != hash(call.result)
          })
        },

        // Return the failing result
        
        failingResult : function() {
          return this.anyResultsFail().result
        },
        
        // Check if any arguments fail
        
        anyArgsFail : function() {
          return any(this.calls, function(call){
            return any(self.expectedArgs, function(i, arg){
              return arg.an_instance_of ?
                       call.args[i].constructor != arg.an_instance_of:
                         hash(arg) != hash(call.args[i])
                       
            })
          })
        },
        
        // Return the failing args
        
        failingArgs : function() {
          return this.anyArgsFail().args
        },
        
        // Report assertion results
        
        report : function() {
          this.passed ? JSpec.stats.passes++ : JSpec.stats.failures++
          return this
        },
        
        // Run the assertion
                
        run : function() {
          var methodString = 'expected ' + object.toString() + '.' + method + '()'
          
          function times(n) {
            return n > 2 ?  n + ' times' : { 1 : 'once', 2 : 'twice' }[n]
          }
          
          if (this.calls.length < this.times)
            this.message = methodString + ' to be called ' + times(this.times) + 
            ', but ' +  (this.calls.length == 0 ? ' was not called' : ' was called ' + times(this.calls.length))
              
          if (this.expectedResult && this.anyResultsFail())
            this.message = methodString + ' to return ' + puts(this.expectedResult) + 
              ' but got ' + puts(this.failingResult())
              
          if (this.expectedArgs && this.anyArgsFail())
            this.message = methodString + ' to be called with ' + puts.apply(this, this.expectedArgs) +
             ' but was called with ' + puts.apply(this, this.failingArgs())
                
          if (!this.message.length) 
            this.passed = true
          
          return this
        }
      })
    },
      
    /**
     * Specification Suite block object.
     *
     * @param {string} description
     * @param {function} body
     * @api private
     */

    Suite : function(description, body) {
      var self = this
      extend(this, {
        body: body,
        description: description,
        suites: [],
        specs: [],
        ran: false,
        hooks: { 'before' : [], 'after' : [], 'before_each' : [], 'after_each' : [] },
        
        // Add a spec to the suite

        addSpec : function(description, body) {
          var spec = new JSpec.Spec(description, body)
          this.specs.push(spec)
          JSpec.stats.specs++ // TODO: abstract
          spec.suite = this
        },

        // Add a hook to the suite

        addHook : function(hook, body) {
          this.hooks[hook].push(body)
        },

        // Add a nested suite

        addSuite : function(description, body) {
          var suite = new JSpec.Suite(description, body)
          JSpec.allSuites.push(suite)
          suite.name = suite.description
          suite.description = this.description + ' ' + suite.description
          this.suites.push(suite)
          suite.suite = this
        },

        // Invoke a hook in context to this suite

        hook : function(hook) {
          if (this.suite) this.suite.hook(hook)
          each(this.hooks[hook], function(body) {
            JSpec.evalBody(body, "Error in hook '" + hook + "', suite '" + self.description + "': ")
          })
        },

        // Check if nested suites are present

        hasSuites : function() {
          return this.suites.length  
        },

        // Check if this suite has specs

        hasSpecs : function() {
          return this.specs.length
        },

        // Check if the entire suite passed

        passed : function() {
          return !any(this.specs, function(spec){
            return !spec.passed() 
          })
        }
      })
    },
    
    /**
     * Specification block object.
     *
     * @param {string} description
     * @param {function} body
     * @api private
     */

    Spec : function(description, body) {
      extend(this, {
        body : body,
        description : description,
        assertions : [],
        
        // Run deferred assertions
        
        runDeferredAssertions : function() {
          each(this.assertions, function(assertion){
            if (assertion.defer) assertion.run().report(), hook('afterAssertion', assertion)
          })
        },
        
        // Find first failing assertion

        failure : function() {
          return find(this.assertions, function(assertion){
            return !assertion.passed
          })
        },

        // Find all failing assertions

        failures : function() {
          return select(this.assertions, function(assertion){
            return !assertion.passed
          })
        },

        // Weither or not the spec passed

        passed : function() {
          return !this.failure()
        },

        // Weither or not the spec requires implementation (no assertions)

        requiresImplementation : function() {
          return this.assertions.length == 0
        },

        // Sprite based assertions graph

        assertionsGraph : function() {
          return map(this.assertions, function(assertion){
            return '<span class="assertion ' + (assertion.passed ? 'passed' : 'failed') + '"></span>'
          }).join('')
        }
      })
    },
    
    Module : function(methods) {
      extend(this, methods)
      extend(this, {
        requires : JSpec.requires
      })
    },
    
    // --- DSLs
    
    DSLs : {
      snake : {
        expect : function(actual){
          return JSpec.expect(actual)
        },

        describe : function(description, body) {
          return JSpec.currentSuite.addSuite(description, body)
        },

        it : function(description, body) {
          return JSpec.currentSuite.addSpec(description, body)
        },

        before : function(body) {
          return JSpec.currentSuite.addHook('before', body)
        },

        after : function(body) {
          return JSpec.currentSuite.addHook('after', body)
        },

        before_each : function(body) {
          return JSpec.currentSuite.addHook('before_each', body)
        },

        after_each : function(body) {
          return JSpec.currentSuite.addHook('after_each', body)
        },
        
        should_behave_like : function(description) {
          return JSpec.shareBehaviorsOf(description)
        }
      }
    },

    // --- Methods
    
    /**
     * Check if _value_ is 'stop'. For use as a
     * utility callback function.
     *
     * @param  {mixed} value
     * @return {bool}
     * @api public
     */
    
    haveStopped : function(value) {
      return value === 'stop'
    },
    
    /**
     * Include _object_ which may be a hash or Module instance.
     *
     * @param  {has, Module} object
     * @api public
     */
    
    include : function(object) {
      var module = object.constructor == JSpec.Module ? object : new JSpec.Module(object)
      this.modules.push(module)
      if ('init' in module) module.init()
      if ('utilities' in module) extend(this.defaultContext, module.utilities)
      if ('matchers' in module) this.addMatchers(module.matchers)
    },
    
    /**
     * Add a module hook _name_, which is immediately
     * called per module with the _args_ given. An array of
     * hook return values is returned.
     *
     * @param  {name} string
     * @param  {mixed} args ...
     * @return {array}
     * @api private
     */
    
    hook : function(name, args) {
      args = argumentsToArray(arguments, 1)
      return inject(JSpec.modules, [], function(results, module){
        if (typeof module[name] == 'function')
          results.push(module[name].apply(module, args))
      })
    },
    
    /**
     * Same as hook() however accepts only one _arg_ which is
     * considered immutable. This function passes the arg
     * to the first module, then passes the return value of the last
     * module called, to the following module. 
     *
     * @param  {string} name
     * @param  {mixed} arg
     * @return {mixed}
     * @api private
     */
    
    hookImmutable : function(name, arg) {
      return inject(JSpec.modules, arg, function(result, module){
        if (typeof module[name] == 'function')
          return module[name].call(module, result)
      })
    },
    
    /**
     * Find a suite by its description or name.
     *
     * @param  {string} description
     * @return {Suite}
     * @api private
     */
    
    findSuite : function(description) {
      return find(this.allSuites, function(suite){
        return suite.name == description || suite.description == description
      })
    },
    
    /**
     * Share behaviors (specs) of the given suite with
     * the current suite.
     *
     * @param  {string} description
     * @api public
     */
    
    shareBehaviorsOf : function(description) {
      if (suite = this.findSuite(description)) this.copySpecs(suite, this.currentSuite)
      else throw 'failed to share behaviors. ' + puts(description) + ' is not a valid Suite name'
    },
    
    /**
     * Copy specs from one suite to another. 
     *
     * @param  {Suite} fromSuite
     * @param  {Suite} toSuite
     * @api public
     */
    
    copySpecs : function(fromSuite, toSuite) {
      each(fromSuite.specs, function(spec){
        toSuite.specs.push(spec)
      })
    },
    
    /**
     * Convert arguments to an array.
     *
     * @param  {object} arguments
     * @param  {int} offset
     * @return {array}
     * @api public
     */
    
    argumentsToArray : function(arguments, offset) {
      return Array.prototype.slice.call(arguments, offset || 0)
    },
    
    /**
     * Return ANSI-escaped colored string.
     *
     * @param  {string} string
     * @param  {string} color
     * @return {string}
     * @api public
     */
    
    color : function(string, color) {
      return "\u001B[" + {
       bold    : 1,
       black   : 30,
       red     : 31,
       green   : 32,
       yellow  : 33,
       blue    : 34,
       magenta : 35,
       cyan    : 36,
       white   : 37
      }[color] + 'm' + string + "\u001B[0m"
    },
    
    /**
     * Default matcher message callback.
     *
     * @api private
     */
    
    defaultMatcherMessage : function(actual, expected, negate, name) {
      return 'expected ' + puts(actual) + ' to ' + 
               (negate ? 'not ' : '') + 
                  name.replace(/_/g, ' ') +
                    ' ' + puts.apply(this, expected.slice(1))
    },
    
    /**
     * Normalize a matcher message.
     *
     * When no messge callback is present the defaultMatcherMessage
     * will be assigned, will suffice for most matchers.
     *
     * @param  {hash} matcher
     * @return {hash}
     * @api public
     */
    
    normalizeMatcherMessage : function(matcher) {
      if (typeof matcher.message != 'function') 
        matcher.message = this.defaultMatcherMessage
      return matcher
    },
    
    /**
     * Normalize a matcher body
     * 
     * This process allows the following conversions until
     * the matcher is in its final normalized hash state.
     *
     * - '==' becomes 'actual == expected'
     * - 'actual == expected' becomes 'return actual == expected'
     * - function(actual, expected) { return actual == expected } becomes 
     *   { match : function(actual, expected) { return actual == expected }}
     *
     * @param  {mixed} body
     * @return {hash}
     * @api public
     */
    
    normalizeMatcherBody : function(body) {
      switch (body.constructor) {
        case String:
          if (captures = body.match(/^alias (\w+)/)) return JSpec.matchers[last(captures)]
          if (body.length < 4) body = 'actual ' + body + ' expected'
          return { match : function(actual, expected) { return eval(body) }}  
          
        case Function:
          return { match : body }
          
        default:
          return body
      }
    },
    
    /**
     * Get option value. This method first checks if
     * the option key has been set via the query string,
     * otherwise returning the options hash value.
     *
     * @param  {string} key
     * @return {mixed}
     * @api public
     */
     
     option : function(key) {
       return (value = query(key)) !== null ? value :
                JSpec.options[key] || null
     },

    /**
     * Generates a hash of the object passed.
     *
     * @param  {object} object
     * @return {string}
     * @api private
     */

    hash : function(object) {
      if (object == undefined) return 'undefined'
      serialize = function(prefix) {
        return inject(object, prefix + ':', function(buffer, key, value){
          return buffer += hash(value)
        })
      }
      switch (object.constructor) {
        case Array : return serialize('a')
        case Object: return serialize('o')
        case RegExp: return 'r:' + object.toString()
        case Number: return 'n:' + object.toString()
        case String: return 's:' + object.toString()
        default: return object.toString()
      }
    },

    /**
     * Return last element of an array.
     *
     * @param  {array} array
     * @return {object}
     * @api public
     */

    last : function(array) {
      return array[array.length - 1]
    },

    /**
     * Convert object(s) to a print-friend string.
     *
     * @param  {object, ...} object
     * @return {string}
     * @api public
     */

    puts : function(object) {
      if (arguments.length > 1) {
        return map(argumentsToArray(arguments), function(arg){
          return puts(arg)
        }).join(', ')
      }
      if (object === undefined) return ''
      if (object === null) return 'null'
      if (object === true) return 'true'
      if (object === false) return 'false'
      if (object.an_instance_of) return 'an instance of ' + object.an_instance_of.name
      if (object.jquery && object.selector.length > 0) return 'selector ' + puts(object.selector) + ''
      if (object.jquery) return escape(object.html())
      if (object.nodeName) return escape(object.outerHTML)
      switch (object.constructor) {
        case String: return "'" + escape(object) + "'"
        case Number: return object
        case Function: return object.name || object 
        case Array : 
          return inject(object, '[', function(b, v){
            return b + ', ' + puts(v)
          }).replace('[,', '[') + ' ]'
        case Object:
          return inject(object, '{', function(b, k, v) {
            return b + ', ' + puts(k) + ' : ' + puts(v)
          }).replace('{,', '{') + ' }'
        default: 
          return escape(object.toString())
      }
    },

    /**
     * Escape HTML.
     *
     * @param  {string} html
     * @return {string}
     * @api public
     */

     escape : function(html) {
       return html.toString().
         replace(/&/gmi, '&amp;').
         replace(/"/gmi, '&quot;').
         replace(/>/gmi, '&gt;').
         replace(/</gmi, '&lt;')
     },
     
     /**
      * Perform an assertion without reporting.
      *
      * This method is primarily used for internal
      * matchers in order retain DRYness. May be invoked 
      * like below:
      *
      *   does('foo', 'eql', 'foo')
      *   does([1,2], 'include', 1, 2)
      *
      * External hooks are not run for internal assertions
      * performed by does().
      *
      * @param  {mixed} actual
      * @param  {string} matcher
      * @param  {...} expected
      * @return {mixed}
      * @api private
      */
     
     does : function(actual, matcher, expected) {
       var assertion = new JSpec.Assertion(JSpec.matchers[matcher], actual, argumentsToArray(arguments, 2))
       return assertion.run().result
     },

    /**
     * Perform an assertion.
     *
     *   expect(true).to('be', true)
     *   expect('foo').not_to('include', 'bar')
     *   expect([1, [2]]).to('include', 1, [2])
     *
     * @param  {mixed} actual
     * @return {hash}
     * @api public
     */

    expect : function(actual) {
      assert = function(matcher, args, negate) {
        var expected = argumentsToArray(args, 1)        
        assertion = new JSpec.Assertion(matcher, actual, expected, negate)
        hook('beforeAssertion', assertion)
        if (matcher.defer) assertion.run()
        else JSpec.currentSpec.assertions.push(assertion.run().report()), hook('afterAssertion', assertion)
        return assertion.result
      }
      
      to = function(matcher) {
        return assert(matcher, arguments, false)
      }
      
      not_to = function(matcher) {
        return assert(matcher, arguments, true)
      }
      
      return {
        to : to,
        should : to,
        not_to: not_to,
        should_not : not_to
      }
    },

    /**
     * Strim whitespace or chars.
     *
     * @param  {string} string
     * @param  {string} chars
     * @return {string}
     * @api public
     */

     strip : function(string, chars) {
       return string.
         replace(new RegExp('['  + (chars || '\\s') + ']*$'), '').
         replace(new RegExp('^[' + (chars || '\\s') + ']*'),  '')
     },
     
     /**
      * Call an iterator callback with arguments a, or b
      * depending on the arity of the callback.
      *
      * @param  {function} callback
      * @param  {mixed} a
      * @param  {mixed} b
      * @return {mixed}
      * @api private
      */
     
     callIterator : function(callback, a, b) {
       return callback.length == 1 ? callback(b) : callback(a, b)
     },
     
     /**
      * Extend an object with another.
      *
      * @param  {object} object
      * @param  {object} other
      * @api public
      */
     
     extend : function(object, other) {
       each(other, function(property, value){
         object[property] = value
       })
     },
     
     /**
      * Iterate an object, invoking the given callback.
      *
      * @param  {hash, array, string} object
      * @param  {function} callback
      * @return {JSpec}
      * @api public
      */

     each : function(object, callback) {
       if (typeof object == 'string') object = object.split(' ')
       for (key in object) 
         if (object.hasOwnProperty(key))
           callIterator(callback, key, object[key])
     },

     /**
      * Iterate with memo.
      *
      * @param  {hash, array} object
      * @param  {object} memo
      * @param  {function} callback
      * @return {object}
      * @api public
      */

     inject : function(object, memo, callback) {
       each(object, function(key, value){
         memo = (callback.length == 2 ?
                   callback(memo, value):
                     callback(memo, key, value)) ||
                       memo
       })
       return memo
     },
     
     /**
      * Destub _object_'s _method_. When no _method_ is passed
      * all stubbed methods are destubbed. When no arguments
      * are passed every object found in JSpec.stubbed will be
      * destubbed.
      *
      * @param  {mixed} object
      * @param  {string} method
      * @api public
      */
     
     destub : function(object, method) {
       if (method) {
         if (object['__prototype__' + method])
           delete object[method]
         else
           object[method] = object['__original__' + method]
         delete object['__prototype__' + method]
         delete object['__original____' + method]
       }
       else if (object) {
         for (var key in object)
           if (captures = key.match(/^(?:__prototype__|__original__)(.*)/))
             destub(object, captures[1])
       }
       else
         while (JSpec.stubbed.length)
            destub(JSpec.stubbed.shift())
     },
     
     /**
      * Stub _object_'s _method_. 
      *
      * stub(foo, 'toString').and_return('bar')
      *
      * @param  {mixed} object
      * @param  {string} method
      * @return {hash}
      * @api public
      */
     
     stub : function(object, method) {
       return {
         and_return : function(result) {
           hook('stubbing', object, method, result)
           JSpec.stubbed.push(object)
           var type = object.hasOwnProperty(method) ? '__original__' : '__prototype__'
           object[type + method] = object[method]
           object[method] = function(){ return result }
         }
      }
     },
     
    /**
     * Map callback return values.
     *
     * @param  {hash, array} object
     * @param  {function} callback
     * @return {array}
     * @api public
     */

    map : function(object, callback) {
      return inject(object, [], function(memo, key, value){
        memo.push(callIterator(callback, key, value))
      })
    },
    
    /**
     * Returns the first matching expression or null.
     *
     * @param  {hash, array} object
     * @param  {function} callback
     * @return {mixed}
     * @api public
     */
         
    any : function(object, callback) {
      return inject(object, null, function(state, key, value){
        if (state == undefined)
          return callIterator(callback, key, value) ? value : state
      })
    },
    
    /**
     * Returns an array of values collected when the callback
     * given evaluates to true.
     *
     * @param  {hash, array} object
     * @return {function} callback
     * @return {array}
     * @api public
     */
    
    select : function(object, callback) {
      return inject(object, [], function(selected, key, value){
        if (callIterator(callback, key, value))
          selected.push(value)
      })
    },

    /**
     * Define matchers.
     *
     * @param  {hash} matchers
     * @api public
     */

    addMatchers : function(matchers) {
      each(matchers, function(name, body){
        JSpec.addMatcher(name, body)  
      })
    },
    
    /**
     * Define a matcher.
     *
     * @param  {string} name
     * @param  {hash, function, string} body
     * @api public
     */
    
    addMatcher : function(name, body) {
      hook('addingMatcher', name, body)
      if (name.indexOf(' ') != -1) {
        var matchers = name.split(/\s+/)
        var prefix = matchers.shift()
        each(matchers, function(name) {
          JSpec.addMatcher(prefix + '_' + name, body(name))
        })
      }
      this.matchers[name] = this.normalizeMatcherMessage(this.normalizeMatcherBody(body))
      this.matchers[name].name = name
    },
    
    /**
     * Add a root suite to JSpec.
     *
     * @param  {string} description
     * @param  {body} function
     * @api public
     */
    
    describe : function(description, body) {
      var suite = new JSpec.Suite(description, body)
      hook('addingSuite', suite)
      this.allSuites.push(suite)
      this.suites.push(suite)
    },
    
    /**
     * Return the contents of a function body.
     *
     * @param  {function} body
     * @return {string}
     * @api public
     */
    
    contentsOf : function(body) {
      return body.toString().match(/^[^\{]*{((.*\n*)*)}/m)[1]
    },

    /**
     * Evaluate a JSpec capture body.
     *
     * @param  {function} body
     * @param  {string} errorMessage (optional)
     * @return {Type}
     * @api private
     */

    evalBody : function(body, errorMessage) {
      var dsl = this.DSL || this.DSLs.snake
      var matchers = this.matchers
      var context = this.context || this.defaultContext
      var contents = this.contentsOf(body)
      hook('evaluatingBody', dsl, matchers, context, contents)
      try { eval('with (dsl){ with (context) { with (matchers) { ' + contents + ' }}}') }
      catch(e) { error(errorMessage, e) }
    },

    /**
     * Pre-process a string of JSpec.
     *
     * @param  {string} input
     * @return {string}
     * @api private
     */

    preprocess : function(input) {
      input = hookImmutable('preprocessing', input)
      return input.
        replace(/(\w+)\.(stub|destub)\((.*?)\)$/gm, '$2($1, $3)').
        replace(/describe\s+(.*?)$/gm, 'describe($1, function(){').
        replace(/\sit\s+(.*?)$/gm, ' it($1, function(){').
        replace(/^(?: *)(before_each|after_each|before|after)(?= |\n|$)/gm, 'JSpec.currentSuite.addHook("$1", function(){').
        replace(/end(?=\s|$)/gm, '});').
        replace(/-\{/g, 'function(){').
        replace(/(\d+)\.\.(\d+)/g, function(_, a, b){ return range(a, b) }).
        replace(/\.should([_\.]not)?[_\.](\w+)(?: |$)(.*)$/gm, '.should$1_$2($3)').
        replace(/([\/\s]*)(.+?)\.(should(?:[_\.]not)?)[_\.](\w+)\((.*)\)$/gm, '$1 expect($2).$3($4, $5)').
        replace(/, \)/gm, ')').
        replace(/should\.not/gm, 'should_not')
    },

    /**
     * Create a range string which can be evaluated to a native array.
     *
     * @param  {int} start
     * @param  {int} end
     * @return {string}
     * @api public
     */

    range : function(start, end) {
      var current = parseInt(start), end = parseInt(end), values = [current]
      if (end > current) while (++current <= end) values.push(current)
      else               while (--current >= end) values.push(current)
      return '[' + values + ']'
    },

    /**
     * Report on the results. 
     *
     * @api public
     */

    report : function() {
      hook('reporting', JSpec.options)
      new (JSpec.options.formatter || JSpec.formatters.DOM)(JSpec, JSpec.options)
    },

    /**
     * Run the spec suites. Options are merged
     * with JSpec options when present.
     *
     * @param  {hash} options
     * @return {JSpec}
     * @api public
     */

    run : function(options) {
      if (any(hook('running'), haveStopped)) return this
      if (options) extend(this.options, options)
      if (option('profile')) console.group('Profile')
      each(this.suites, function(suite) { JSpec.runSuite(suite) })
      if (option('profile')) console.groupEnd()
      return this
    },
    
    /**
     * Run a suite.
     *
     * @param  {Suite} suite
     * @api public
     */

    runSuite : function(suite) {
      this.currentSuite = suite
      this.evalBody(suite.body)
      suite.ran = true
      suite.hook('before'), hook('beforeSuite', suite)
      each(suite.specs, function(spec) {
        suite.hook('before_each')
        JSpec.runSpec(spec)
        suite.hook('after_each')
      })
      if (suite.hasSuites()) {
        each(suite.suites, function(suite) {
          JSpec.runSuite(suite)
        })
      }
      suite.hook('after'), hook('afterSuite', suite)
      this.stats.suitesFinished++
    },
         
    /**
     * Report a failure for the current spec.
     *
     * @param  {string} message
     * @api public
     */
     
     fail : function(message) {
       JSpec.currentSpec.assertions.push({ passed : false, message : message })
       JSpec.stats.failures++
     },

    /**
     * Run a spec.
     *
     * @param  {Spec} spec
     * @api public
     */

    runSpec : function(spec) {
      this.currentSpec = spec
      if (option('profile')) console.time(spec.description)
      hook('beforeSpec', spec)
      try { this.evalBody(spec.body) }
      catch (e) { fail(e) }
      spec.runDeferredAssertions()
      hook('afterSpec', spec)
      if (option('profile')) console.timeEnd(spec.description)
      destub()
      this.stats.specsFinished++
      this.stats.assertions += spec.assertions.length
    },

    /**
     * Require a dependency, with optional message.
     *
     * @param  {string} dependency
     * @param  {string} message (optional)
     * @api public
     */

    requires : function(dependency, message) {
      hook('requiring', dependency, message)
      try { eval(dependency) }
      catch (e) { throw 'JSpec depends on ' + dependency + ' ' + message }
    },

    /**
     * Query against the current query strings keys
     * or the queryString specified.
     *
     * @param  {string} key
     * @param  {string} queryString
     * @return {string, null}
     * @api private
     */

    query : function(key, queryString) {
      var queryString = (queryString || (main.location ? main.location.search : null) || '').substring(1)
      return inject(queryString.split('&'), null, function(value, pair){
        parts = pair.split('=')
        return parts[0] == key ? parts[1].replace(/%20|\+/gmi, ' ') : value
      })
    },

    /**
     * Throw a JSpec related error.
     *
     * @param {string} message
     * @param {Exception} e
     * @api public
     */

    error : function(message, e) {
      throw (message ? message : '') + e.toString() + 
              (e.line ? ' near line ' + e.line : '')
    },
    
    /**
     * Ad-hoc POST request for JSpec server usage.
     *
     * @param  {string} url
     * @param  {string} data
     * @api private
     */
    
    post : function(url, data) {
      if (any(hook('posting', url, data), haveStopped)) return
      var request = this.xhr()
      request.open('POST', url, false)
      request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
      request.send(data)
    },

    /**
     * Report to server with statistics.
     *
     * @param  {string} url
     * @api private
     */
    
    reportToServer : function(url) {
      if (any(hook('reportingToServer', url), haveStopped)) return
      JSpec.post(url || 'http://localhost:4444', 'passes=' + JSpec.stats.passes + '&failures=' + JSpec.stats.failures)
			if ('close' in main) main.close()
    },
    
    /**
     * Instantiate an XMLHttpRequest.
     *
     * @return {ActiveXObject, XMLHttpRequest}
     * @api private
     */
    
    xhr : function() {
      return 'ActiveXObject' in main ? 
               new ActiveXObject("Microsoft.XMLHTTP"): 
                 new XMLHttpRequest()
    },
    
    /**
     * Check for HTTP request support.
     *
     * @return {bool}
     * @api private
     */
    
    hasXhr : function() {
      return 'XMLHttpRequest' in main || 'ActiveXObject' in main
    },

    /**
     * Load a files contents.
     *
     * @param  {string} file
     * @return {string}
     * @api public
     */

    load : function(file) {
      if (any(hook('loading', file), haveStopped)) return
      if (this.hasXhr()) {
        var request = this.xhr()
        request.open('GET', file, false)
        request.send(null)
        if (request.readyState == 4) return request.responseText
      }
      else if ('readFile' in main)
        return readFile(file)
      else
        error('cannot load ' + file)
    },

    /**
     * Load, pre-process, and evaluate a file.
     *
     * @param {string} file
     * @param {JSpec}
     * @api public
     */

    exec : function(file) {
      if (any(hook('executing', file), haveStopped)) return this
      eval('with (JSpec){' + this.preprocess(this.load(file)) + '}')
      return this
    }
  }

  // --- Utility functions

  var main = this
  var find = JSpec.any
  var utils = 'haveStopped stub hookImmutable hook destub map any last fail range each option inject select error escape \
               extend puts hash query strip color does addMatchers callIterator argumentsToArray'.split(/\s+/)
  while (utils.length) util = utils.shift(), eval('var ' + util + ' = JSpec.' + util)
  if (!main.setTimeout) main.setTimeout = function(callback){ callback() }

  // --- Matchers

  addMatchers({
    equal              : "===",
    be                 : "alias equal",
    be_greater_than    : ">",
    be_less_than       : "<",
    be_at_least        : ">=",
    be_at_most         : "<=",
    be_a               : "actual.constructor == expected",
    be_an              : "alias be_a",
    be_an_instance_of  : "actual instanceof expected",
    be_null            : "actual == null",
    be_true            : "actual == true",
    be_false           : "actual == false",
    be_type            : "typeof actual == expected",
    match              : "typeof actual == 'string' ? actual.match(expected) : false",
    respond_to         : "typeof actual[expected] == 'function'",
    have_length        : "actual.length == expected",
    be_within          : "actual >= expected[0] && actual <= last(expected)",
    have_length_within : "actual.length >= expected[0] && actual.length <= last(expected)",

    eql : function(actual, expected) {
      return actual.constructor == Array ||
               actual instanceof Object ? 
                 hash(actual) == hash(expected):
                   actual == expected
    },
    
    receive : { defer : true, match : function(actual, method, times) {
      proxy = new JSpec.ProxyAssertion(actual, method, times)
      JSpec.currentSpec.assertions.push(proxy)
      return proxy
    }},
    
    be_empty : function(actual) {
      if (actual.constructor == Object && actual.length == undefined)
        for (var key in actual)
          return false;
      return !actual.length
    },

    include : function(actual) {
      for (state = true, i = 1; i < arguments.length; i++) {
        arg = arguments[i]
        switch (actual.constructor) {
          case String: 
          case Number:
          case RegExp:
          case Function:
            state = actual.toString().match(arg.toString())
            break
         
          case Object:
            state = arg in actual
            break
          
          case Array: 
            state = any(actual, function(value){ return hash(value) == hash(arg) })
            break
        }
        if (!state) return false
      }
      return true
    },

    throw_error : { match : function(actual, expected, message) {
      try { actual() }
      catch (e) {
        this.e = e
        var assert = function(arg) {
          switch (arg.constructor) {
            case RegExp   : return arg.test(e)
            case String   : return arg == (e.message || e.toString())
            case Function : return (e.name || 'Error') == arg.name
          }
        }
        return message ? assert(expected) && assert(message) :
                 expected ? assert(expected) :
                   true
      }
    }, message : function(actual, expected, negate) {
      // TODO: refactor when actual is not in expected [0]
      var message_for = function(i) {
        if (expected[i] == undefined) return 'exception'
        switch (expected[i].constructor) {
          case RegExp   : return 'exception matching ' + puts(expected[i])
          case String   : return 'exception of ' + puts(expected[i])
          case Function : return expected[i].name || 'Error'
        }
      }
      exception = message_for(1) + (expected[2] ? ' and ' + message_for(2) : '')
      return 'expected ' + exception + (negate ? ' not ' : '' ) +
               ' to be thrown, but ' + (this.e ? 'got ' + puts(this.e) : 'nothing was')
    }},
    
    have : function(actual, length, property) {
      return actual[property].length == length
    },
    
    have_at_least : function(actual, length, property) {
      return actual[property].length >= length
    },
    
    have_at_most :function(actual, length, property) {
      return actual[property].length <= length
    },
    
    have_within : function(actual, range, property) {
      length = actual[property].length
      return length >= range.shift() && length <= range.pop()
    },
    
    have_prop : function(actual, property, value) {
      return actual[property] == null || 
               actual[property] instanceof Function ? false:
                 value == null ? true:
                   does(actual[property], 'eql', value)
    },
    
    have_property : function(actual, property, value) {
      return actual[property] == null ||
               actual[property] instanceof Function ? false:
                 value == null ? true:
                   value === actual[property]
    }
  })

})();