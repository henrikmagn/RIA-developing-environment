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


var BugTrackr = {
	projectArray: [],
	statusArray: [],
	Project: Project,
	Bug: Bug,
	Status: Status,
	Comment: Comment,
		
	dom: 
	{
	    wrapper: "wrapper",
	    projectsWrapper: "projectsWrapper",
	    projectForm: "projectForm",
	    createProjectButton: "projectButton",
	    projectsDiv: "projectsDiv",
	    projectDiv: "project",
	    bugText: "bugText",
	    bugWrapper: "bugWrapper",
	    createBug: "createBug",
	    projectBugs: "projectBugs",
	    statusSelect: "statusSelect",
	    projectText: "projectText",
	    singleProjectWrapper: "singleProjectWrapper",
	    bugCommentsHref: "bugCommentsHref",
	    bugEdit: "bugEdit",
	    bugDelete: "bugDelete",
	    bugComments: "bugComments",
	    bugSave: "bugSave",
	    commentText: "commentText",
	    statusBug: "statusBug",
	    bugDesc: "bugDesc",
	    sendComment: "sendComment"
	},
	init: function()
	{		
		paper = new Raphael(document.getElementById('splashScreen'), 700, 700);

		var t = paper.text((700 / 2), 100, "BugTrackr");
		t.attr({fill: '#000', 'font-size': 44}); 
		
		var p = paper.path("M10 150 L10 150");		
		p.attr({
			stroke: '#000',
		    'stroke-width': 7
		});
		
		p.animate({  
			path: "M 20 150 L680 150"  
		}, 3000);  
		
		var i = paper.image("img/bug.png", (700 / 2 - (128 / 2)), 700, 128, 128);
		
		i.animate({y: 700 / 2 - 128 / 2}, 3000, 'bounce', function() {
															$('#splashScreen').animate({
															    opacity: 0
															}, 500, function() {
																$('#splashScreen').remove();
															});														
														});
	
		/** Creates the status objects */
		BugTrackr.createStatuses();
		
		if (typeof(localStorage) == "undefined")
		{
			alert("Local storage not supported by this browser.");
		}
		
		this.checkSavedProjects();
		
		$("#" + this.dom.createProjectButton).bind("click",function(){
			BugTrackr.createProject();
			return false;
		});				
			
		/** Check to se if there are any projects */
		BugTrackr.drawProjects();
		
		if(this.projectArray.length > 0)
		{
			this.showProject(0);
			window.location.hash = "project0s"
		}
		
		this.setup();
	},
	setup: function()
	{
		$(window).bind( 'hashchange', function(){
		    var hash = location.hash;
		    
		    $("#" + BugTrackr.dom.projectsDiv + " a").each(function(index){
		    	
		    if(hash !== "")
		    {	
		    	var that = $(this);
		      
		      	if(that.attr('href') + "s" === hash)
		      	{
		      		that.parent().addClass('ui-state-active');
					BugTrackr.showProject(index);
		      	}
		      	else
		      	{
		      		that.parent().removeClass('ui-state-active');
		      	}
		    }
		    });  
		})
		 
		$(window).trigger('hashchange');
	},
	checkSavedProjects: function()
	{
		var retreivedProjects = localStorage.getItem('projects');
		var parsedProjects = JSON.parse(retreivedProjects);
	
		for(var p in parsedProjects)
		{
			var currentProject = parsedProjects[p];
			var newP = new Project(currentProject.name, currentProject.createDate);
			
			for(var b in currentProject.bugs)
			{
				var bug = currentProject.bugs[b];
			 	var bStatus = new Status(bug.bugStatus.name, bug.bugStatus.color);
			 	var newB = new Bug(bug.id, bug.description, bug.bugDate, bStatus);
			 	
			 	for(var c in bug.comments)
			 	{
			 		var comment = bug.comments[c];
			 		var newC = new Comment(comment.commentText, comment.commentDate);
			 		newB.comments.push(newC);
			 	}
			 	
			 	newP.bugs.push(newB);
			 }
			 
			 this.projectArray.push(newP);
		}
	},
	/**
	* Checks for projects and draws the projects that exists
	*/
	drawProjects: function()
	{
		/** Resets the div */
		var projectsDiv = $("#" + this.dom.projectsDiv);
		projectsDiv.text("");
		
		/** Iterates the project array and draws the HTML for each project */
		$.each(this.projectArray, function(intIndex, p)
		{
			var html = "<div class='project ui-state-default'>";
				html += "<a href='#project" + intIndex + "' id='" + BugTrackr.dom.projectDiv + intIndex + "'>" + p.name + "</a>";
			html += "</div>";
			
			projectsDiv.append(html);
						
			var tempDiv = $("#" + BugTrackr.dom.projectDiv + intIndex);
			
			tempDiv.bind("click",function(){
				window.location.hash = tempDiv.attr("id") + "s";
				return false;
			});
			
			tempDiv.mouseover(function(){
			     tempDiv.parent().addClass("ui-state-hover");
			   }).mouseout(function(){
				tempDiv.parent().removeClass("ui-state-hover");
			});
		
		});
	},
	/**
	 * Creates a project from form data
	 */
	createProject: function()
	{
		var projectTextField = 	$("#" + this.dom.projectText);
		var projectName = projectTextField.val();
		var newProject = new Project(projectName, this.getDateString());
		this.projectArray.push(newProject);
		localStorage.setItem('projects', JSON.stringify(this.projectArray));
		
		this.drawProjects();
		projectTextField.val("");
		this.showProject(this.projectArray.length - 1);
		window.location.hash = "project" + (this.projectArray.length - 1) + "s";
	},
	/**
	 * Draws HTML for single project
	 * @param {int} index The index of the project
	 */
	showProject: function(index)
	{
		/** Gets the project object that was clicked */
		var project = this.projectArray[index];
		
		/** Resets the single project div */
		var sProjectWrapper = $("#" + this.dom.singleProjectWrapper);
		sProjectWrapper.text("");
		
		/** Draws the project and its bugs */
		sProjectWrapper.append("<h1>" + project.name + "</h1>");
		sProjectWrapper.append("<textarea id='" + this.dom.bugText + "' rows='5' class='bugTextField' />");
		sProjectWrapper.append("<select name='bugStatuses' id='" + this.dom.statusSelect + "'></select>");
		
		$.each(this.statusArray, function(intIndex, s)
		{
			$("#" + BugTrackr.dom.statusSelect).append("<option value='" + intIndex + "'>" + s.name + "</option>");
		});
						
		sProjectWrapper.append("<input type='submit' id='" + this.dom.createBug + "' class='createBugButton ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' value='Create bug' />");
		sProjectWrapper.append("<div class='clear'></div>");
		sProjectWrapper.append("<div id='" + this.dom.projectBugs + "'></div>");
		
		$("#" + this.dom.createBug).bind("click",function(){
			BugTrackr.createBug(project);
			return false;
		});
		
		BugTrackr.getProjectBugs(project);
	},
	/**
	 * Fills the status array with status objects
	 */
	createStatuses: function()
	{
		if(this.statusArray.length === 0)
		{
			var s1 = new Status("New", "#FFA0A0");
			this.statusArray.push(s1);
			var s2 = new Status("Feedback", "#FF50A8");
			this.statusArray.push(s2);
			var s3 = new Status("Acknowledged", "#FFD850");
			this.statusArray.push(s3);
			var s4 = new Status("Confirmed", "#FFFFB0");
			this.statusArray.push(s4);
			var s5 = new Status("Assigned", "#C8C8FF");
			this.statusArray.push(s5);
			var s6 = new Status("Resolved", "#CCEEDD");
			this.statusArray.push(s6);
			var s7 = new Status("Closed", "#E8E8E8");
			this.statusArray.push(s7);
		}
	},
	/**
	 * Gets bugs for a project and draws them
	 * @param {project} project The project to get bugs for
	 */
	getProjectBugs: function(project)
	{
		/** Resets the bug div */
		var projectBugsNode = $("#" + this.dom.projectBugs);
		projectBugsNode.text("");
		
		/** Iterates the projects bugs  and draws them */
		$.each(project.bugs, function(intIndex, b)
		{			
			projectBugsNode.append("<div id='" + BugTrackr.dom.bugWrapper + intIndex + "' class='singleBug'></div>");
			var bugWrapper = $("#" + BugTrackr.dom.bugWrapper + intIndex);
		
			bugWrapper.append(b.bugDate + " - Status: " + b.bugStatus.name);
			bugWrapper.append("<div class='statusColor' style='background-color: " + b.bugStatus.color + ";'></div><br />")
			bugWrapper.append("<p>" + b.description + "</p>");
			
			bugWrapper.append("<a href='#' id='" + BugTrackr.dom.bugCommentsHref + intIndex + "'>Comments (" + b.comments.length + ")</a> - ");
			bugWrapper.append("<a href='#' id='" + BugTrackr.dom.bugEdit + intIndex + "'>Edit</a> - ");
			bugWrapper.append("<a href='#' id='" + BugTrackr.dom.bugDelete + intIndex + "'>Delete</a>");
				
			bugWrapper.append("<div id='" + BugTrackr.dom.bugComments + intIndex + "' class='comments'></div>");
			var bugComments = $("#" + BugTrackr.dom.bugComments + intIndex);
			
			/** Iterates the comments for the bug and draws them */
			$.each(b.comments, function(intIndex, c)
			{
				bugComments.append("<p>" + c.commentText + "<br />" + c.commentDate +"</p>");
			});
			
			bugComments.append("<textarea id='" + BugTrackr.dom.commentText + intIndex + "' rows='3' class='commentTextField' /><br />");
			bugComments.append("<input type='submit' id='"+BugTrackr.dom.sendComment + intIndex + "' value='Send' class='commentButton ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' />");
			bugComments.append("<div class='clear'></div>");
			bugComments.hide();
			
			bugWrapper.addClass("ui-corner-all");
			bugWrapper.css("background-color", "#E6E6E6");
			
			$("#" + BugTrackr.dom.bugCommentsHref + intIndex).bind("click",function(){
				BugTrackr.toggleComment(intIndex);
			});
			
			$("#" + BugTrackr.dom.bugEdit + intIndex).bind("click",function(){
				BugTrackr.editBug(project, intIndex);
			});
			
			$("#" + BugTrackr.dom.bugDelete + intIndex).bind("click",function(){
				BugTrackr.deleteBug(project, intIndex);
			});
			
			$("#" + BugTrackr.dom.sendComment + intIndex + "").bind("click",function(){
				BugTrackr.createComment(project, intIndex);
				return false;
			});
		});
	},
	/**
	 * Creates a bug from form data
	 * @param {project} project The project to create the bug in
	 */
	createBug: function(project)
	{
		var bugText = $("#" + this.dom.bugText);
		var bugStatus = this.statusArray[$("#" + this.dom.statusSelect).val()];
		var bug = new Bug(project.bugs.length, bugText.val(), this.getDateString(), bugStatus);
		project.add(bug);
		localStorage.setItem('projects', JSON.stringify(this.projectArray));
		
		BugTrackr.getProjectBugs(project);
		bugText.val("");
	},
	/**
	 * Draws the edit bug form
	 * @param {project} project The project to edit the bug in
	 * @param {int} bugIndex The index of the bug to edit
	 */
	editBug: function (project, bugIndex)
	{	
		var b = project.bugs[bugIndex];
		var bugWrapper = $("#" + this.dom.bugWrapper + bugIndex);
		
		bugWrapper.empty();
		bugWrapper.append(b.bugDate + " - Status: ");
		bugWrapper.append("<select name='bugStatuses' id='" + this.dom.statusBug + bugIndex + "'></select>");
		
		$.each(this.statusArray, function(intIndex, s)
		{
			$("#" + BugTrackr.dom.statusBug + bugIndex + "").append("<option value='" + intIndex + "'>" + s.name + "</option>");
		});
		
		/** Selects the status the bug has */
		$.each(this.statusArray, function(intIndex, s)
		{
			if(s === b.bugStatus)
			{
				$("#" + BugTrackr.dom.statusBug + bugIndex + " option[value='" + intIndex + "']").attr('selected', 'selected');
			}
		});
		
		bugWrapper.append("<div class='statusColor' style='background-color: " + b.bugStatus.color + ";'></div><br />")
		bugWrapper.append("<textarea id='" + this.dom.bugDesc + bugIndex + "' rows='3' class='editBugTextField'>" + b.description + "</textarea><br />");
		bugWrapper.append("<a href='#' id='" + this.dom.bugCommentsHref + bugIndex + "'>Comments (" + b.comments.length + ")</a> - ");
		bugWrapper.append("<a href='#' id='" + this.dom.bugSave + bugIndex + "'>Save</a> - ");
		bugWrapper.append("<a href='#' id='" + this.dom.bugDelete + bugIndex + "'>Delete</a>");
			
		bugWrapper.append("<div id='" + this.dom.bugComments + bugIndex + "' class='comments'></div>");
		var bugComments = $("#" + BugTrackr.dom.bugComments + bugIndex);
		
		/** Iterates the bugs comments */
		$.each(b.comments, function(intIndex, c)
		{
			bugComments.append("<p>" + c.commentText + "<br />" + c.commentDate +"</p>");
		});
		
		bugComments.append("<textarea id='" +  this.dom.commentText + bugIndex + "' rows='3' class='commentTextField' /><br />");
		bugComments.append("<input type='submit' id='" + this.dom.sendComment + bugIndex + "' class='commentButton ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' value='Send' />");
		bugComments.append("<div class='clear'></div>");
		bugComments.hide();
		
		$("#bugCommentsHref" + bugIndex).bind("click",function(){
			BugTrackr.toggleComment(bugIndex);
		});
		
		$("#bugSave" + bugIndex).bind("click",function(){
			BugTrackr.saveBug(project, bugIndex);
		});
		
		$("#bugDelete" + bugIndex).bind("click",function(){
			BugTrackr.deleteBug(project, bugIndex);
		});
		
		$("#sendComment" + bugIndex).bind("click",function(){
			BugTrackr.createComment(project, bugIndex);
			return false;
		});
	},
	/**
	 * Saves bug with help from form data
	 * @param {project} project The project to save the bug in
	 * @param {int} bugIndex The index of the bug to save
	 */
	saveBug: function(project, bugIndex)
	{
		var bug = project.bugs[bugIndex];
		var bugStatus = this.statusArray[$("#" + this.dom.statusBug + bugIndex + "").val()];
		bug.description = $("#" + this.dom.bugDesc + bugIndex).val();
		bug.bugStatus = bugStatus;
		localStorage.setItem('projects', JSON.stringify(this.projectArray));
		
		BugTrackr.getProjectBugs(project);
	},
	/**
	 * Delete a bug with index
	 * @param {project} project The project to delete the bug from
	 * @param {int} bugIndex The index of the bug to delete
	 */
	deleteBug: function(project, bugIndex)
	{
		project.bugs.splice(bugIndex, 1);
		localStorage.setItem('projects', JSON.stringify(this.projectArray));
		
		BugTrackr.getProjectBugs(project);
	},
	/**
	 * Creates a comment
	 * @param {project} project The project to create the comment in
	 * @param {int} index The index of the bug to post the comment for
	 */
	createComment: function(project, index)
	{
		var bug = project.bugs[index];
		
		var comment = new Comment($("#" + this.dom.commentText + index + "").val(), BugTrackr.getDateString());
		bug.add(comment);
		localStorage.setItem('projects', JSON.stringify(this.projectArray));
		
		BugTrackr.getProjectBugs(project);
	},
	/**
	 * Toggles the visibility of comments
	 * @param {int} index The index of the bug to toggle comments for
	 */
	toggleComment: function(index)
	{
		$("#" + this.dom.bugComments + index).slideToggle("slow");
	},
	/**
	 * Returns a formated string of current time
	 */
	getDateString: function()
	{
		var date = new Date();
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		if (month < 10){
			month = "0" + month;
		}
		
		var day = date.getDate();
		var hour = date.getHours();
		if (hour < 10){
			hour = "0" + hour;
		}
		
		var minutes = date.getMinutes();
		if (minutes < 10){
			minutes = "0" + minutes;
		}
		
		var dateStr = year + "-" + month + "-" + day + " " + hour + ":" + minutes;
		return dateStr;
	},
	data: 
	{
		
	}};
	
	BugTrackr.init();				// initiate application		
	window.BugTrackr = BugTrackr;	// expose the BugTrackr
})();