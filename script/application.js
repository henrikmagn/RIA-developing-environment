// Inspired by base2 and Prototype
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
  // The base Class implementation (does nothing)
  this.Class = function(){};
  
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;
    
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
    
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" && 
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
            
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
            
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);        
            this._super = tmp;
            
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
    
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
    
    // Populate our constructed prototype object
    Class.prototype = prototype;
    
    // Enforce the constructor to be what we expect
    Class.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;
    
    return Class;
  };
})();

	(function($){
		var appname = 'Application',
		Singleton = {
			init: function(){
				$("h1").text("Application initialized!");
			},
			data: 
			{
				somedata: 'foobar',
			}
		};
		
		window[appname] = Singleton;  	// expose the singleton
		Singleton.init();            	// initiate application
	})(jQuery);

/**
 * @class A Project object
 */
var Project = Class.extend (
/** @lends Project.prototype */
{
	
	init: function(name, date) {	
		this.name = name;
		this.createDate = date;
		this.bugs = [];
	},
	
	/** The name of the Project */
	name: null,
	
	/** The date the Project was created */
	createDate: null,
	
	/** Array of bugs in the Project */
	bugs: null,
	
	/**
	 * Adds a bug to the project
	 * @param {bug} bug The new bug to be added
	 */
	add: function(bug)	{
		this.bugs.push(bug);	
	},
	
	/**
	 * Removes a bug from the project
	 * @param {Bug} bug The bug to be deleted
	 */
	remove: function(index) {
		this.bugs.splice(index, 1);
	}	
});

/**
 * @class A Bug object
 */
var Bug = Class.extend (
/** @lends Bug.prototype */
{
	
	init: function(id, description, bugDate, bugStatus) {	
		this.id = id;
		this.description = description;
		this.bugDate = bugDate;
		this.bugStatus = bugStatus;
		this.comments = [];
	},
	
	/** The id of the Bug */
	id: null,
	
	/** The description of the Bug */
	description: null,
	
	/** The date the Bug was created */
	bugDate: null,
	
	/** The Status of the Bug */
	bugStatus: null,
	
	/** Array of comments for the Bug */
	comments: null,
	
	/**
	 * Adds a comment to the bug
	 * @param {Comment} comment The Comment to be added
	 */
	add: function(comment)	{
		this.comments.push(comment);
	},
	
	/**
	 * Sets the status of the bug
	 * @param {Status} status The Status to be set
	 */
	remove: function(index)	{
		this.comments.splice(index, 1);
	}	
});

/**
 * @class A Status object
 */
var Status = Class.extend (
/** @lends Status.prototype */
{
	
	init: function(name, color) {	
		this.name = name;
		this.color = color;
	},
	
	/** Name of the Status */
	name: null,
	
	/** Color of the Status */
	color: null
	
});

/**
 * @class A Comment object
 */
var Comment = Class.extend (
/** @lends Comment.prototype */
{
	
	init: function(text, date) {	
		this.commentText = text;
		this.commentDate = date;
	},
	
	/** The text for the Comment */
	commentText: null,
	
	/** The date for the Comment */
	commentDate: null
	
});